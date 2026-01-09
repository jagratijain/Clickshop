// Updated Component TypeScript
import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { GeminiService } from '../../../services/util/gemini.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { Router } from '@angular/router';

interface Product {
  id: string;
  name: string;
  features: string;
  price: string;
}

interface AIResponse {
  products: Product[];
  message: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  formattedContent?: SafeHtml;
  timestamp: Date;
  isTyping?: boolean;
  products?: Product[]; // Add products to chat message
}

@Component({
  selector: 'app-gemini-assistant',
  standalone: false,
  templateUrl: './gemini-assistant.component.html',
  styleUrl: './gemini-assistant.component.css'
})
export class GeminiAssistantComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  
  isModalOpen = false;
  userPrompt = '';
  chatHistory: ChatMessage[] = [];
  isLoading = false;
  isTyping = false;
  
  private readonly CHAT_STORAGE_KEY = 'clickshop_ai_chat_history';

  samplePrompts = [
    'What gifts would be suitable for a 12-year-old?',
    'I need a laptop for video editing, what should I buy?',
    'Suggest some products for home office setup',
    'What are the best tech gadgets under ₹5000?'
  ];

  constructor(
    private geminiService: GeminiService,
    private sanitizer: DomSanitizer,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadChatHistory();

  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  loadChatHistory(): void {
    try {
      const savedChat = localStorage.getItem(this.CHAT_STORAGE_KEY);
      if (savedChat) {
        const parsedChat = JSON.parse(savedChat);
        // Restore chat history and reformat messages
        this.chatHistory = parsedChat.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp) // Convert timestamp back to Date object
        }));
        
        // Re-format all messages to restore SafeHtml content
        this.chatHistory.forEach(msg => this.formatMessage(msg));
      } else {
        // No saved chat, add welcome message
        this.addWelcomeMessage();
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Fallback to welcome message if loading fails
      this.addWelcomeMessage();
    }
  }

  saveChatHistory(): void {
    try {
      // Save chat history excluding the SafeHtml content (which can't be serialized)
      const chatToSave = this.chatHistory.map(msg => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp,
        isTyping: msg.isTyping,
        products: msg.products
      }));
      
      localStorage.setItem(this.CHAT_STORAGE_KEY, JSON.stringify(chatToSave));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  clearChatHistory(): void {
    try {
      localStorage.removeItem(this.CHAT_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  }


  addWelcomeMessage(): void {
    const welcomeMessage: ChatMessage = {
      id: this.generateId(),
      type: 'ai',
      content: `👋 Hi there! I'm your ClickShop AI assistant. I'm here to help you find the perfect products and answer any shopping questions you might have.
  What can I help you with today?`,
      timestamp: new Date()
    };
    this.formatMessage(welcomeMessage);
    this.chatHistory.push(welcomeMessage);
  }

  toggleModal(): void {
    this.isModalOpen = !this.isModalOpen;
    if (this.isModalOpen) {
      setTimeout(() => {
        const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (inputElement) {
          inputElement.focus();
        }
      }, 100);
    }
  }

  clearChat(): void {
    this.chatHistory = [];
    this.userPrompt = '';
    this.clearChatHistory()
    this.addWelcomeMessage();
  }

  async sendPrompt(): Promise<void> {
    if (!this.userPrompt.trim() || this.isLoading) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: this.generateId(),
      type: 'user',
      content: this.userPrompt.trim(),
      timestamp: new Date()
    };
    this.formatMessage(userMessage);
    this.chatHistory.push(userMessage);
    
    const currentPrompt = this.userPrompt;
    this.userPrompt = '';
    this.isLoading = true;
    
    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: 'typing',
      type: 'ai',
      content: '',
      timestamp: new Date(),
      isTyping: true
    };
    this.chatHistory.push(typingMessage);
    
    try {
      const response = await this.geminiService.getAiResponse_Agent(currentPrompt);
      console.log(response);
      
      // Parse the AI response
      const data: AIResponse = this.parseAIResponse(response);
      console.log(data);
      
      this.chatHistory = this.chatHistory.filter(msg => msg.id !== 'typing');
      
      // Create AI response with products
      const aiMessage: ChatMessage = {
        id: this.generateId(),
        type: 'ai',
        content: data.message || 'Here are the products I found for you:',
        products: data.products,
        timestamp: new Date()
      };
      
      this.formatMessage(aiMessage);
      this.chatHistory.push(aiMessage);
      this.saveChatHistory()
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      this.chatHistory = this.chatHistory.filter(msg => msg.id !== 'typing');
      
      const errorMessage: ChatMessage = {
        id: this.generateId(),
        type: 'ai',
        content: '⚠️ Sorry, I encountered an error. Please try again later.',
        timestamp: new Date()
      };
      this.formatMessage(errorMessage);
      this.chatHistory.push(errorMessage);
      this.saveChatHistory(); 
    } finally {
      this.isLoading = false;
    }
  }

  parseAIResponse(response: string): AIResponse {
    try {
      const data = JSON.parse((marked.lexer(response).find(t => t.type === 'code') as any)?.text || '{}');
      return {
        products: data.products || [],
        message: data.message || ''
      };
    } catch (error) {
      console.error('Parse error:', error);
      return { products: [], message: 'Failed to parse response' };
    }
  }

  navigateToProduct(productId: string): void {
    // this.router.navigate(['/product', productId]);
    const url = this.router.serializeUrl(this.router.createUrlTree(['/product', productId]));
    window.open(url, '_blank');
    // this.toggleModal(); // Close modal after navigation
  }

  formatPrice(price: string): string {
    // Remove 'INR' and format the price nicely
    return price.replace('INR', '₹').replace('.0', '');
  }

  useSamplePrompt(prompt: string): void {
    this.userPrompt = prompt;
    this.sendPrompt();
  }

  formatMessage(message: ChatMessage): void {
    if (!message.content || message.isTyping) return;

    let formatted = message.content
      .replace(/\*\*(.*?)\*\*/g, '<span class="font-semibold text-gray-900 dark:text-white">$1</span>')
      .replace(/\*(.*?)\*/g, '<span class="italic text-gray-600 dark:text-gray-300">$1</span>')
      .replace(/\n/g, '<br>')
      .replace(/^• (.*?)$/gm, '<div class="flex items-start mt-1"><span class="text-blue-500 mr-2 mt-0.5">•</span><span>$1</span></div>')
      .replace(/^\d+\. (.*?)$/gm, '<div class="flex items-start mt-1"><span class="text-blue-500 mr-2 mt-0.5 font-medium">•</span><span>$1</span></div>')
      .replace(/^### (.*?)$/gm, '<h3 class="text-base font-semibold text-gray-900 dark:text-white mt-3 mb-1">$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2 class="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1 class="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-2">$1</h1>');
    
    message.formattedContent = this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private scrollToBottom(): void {
    if (this.chatContainer) {
      try {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      } catch (err) {
        console.log('Scroll error:', err);
      }
    }
  }

  getTimeString(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return timestamp.toLocaleDateString();
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  trackByProductId(index: number, product: Product): string {
    return product.id;
  }
  
}