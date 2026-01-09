import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminServiceService } from '../../../services/admin/admin-service.service';
import { GeminiService } from '../../../services/util/gemini.service';
import { ProductServiceService } from '../../../services/productService/product-service.service';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-edit-products',
  standalone: false,
  templateUrl: './edit-products.component.html',
  styleUrl: './edit-products.component.css'
})
export class EditProductsComponent {
  productId: number = 0;
  isNewProduct: boolean = true;
  isLoading: boolean = false;
  isGeneratingDescription: boolean = false;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  productForm: FormGroup;
  categories: string[] = [];
  isCategoryLoading: boolean = false;


  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminServiceService,
    private productService: ProductServiceService,
    private geminiService: GeminiService,
    private toast:HotToastService
  ) {
    // Initialize form with empty values and validators
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0.01)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      customCategory: [''],
      imageUrl: ['']
    });
  }

  ngOnInit(): void {
    // Check if we're editing an existing product or creating a new one
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.productId = +params['id'];
        this.isNewProduct = false;
        this.loadProduct();
      } else {
        this.isNewProduct = true;
      }
    });

    // Load available categories (optional, could come from API)
    this.loadCategories();
  }

  loadProduct(): void {
    this.isLoading = true;
    this.adminService.getProductById(this.productId).subscribe({
      next: (product) => {
        // Populate form with existing product data
        this.productForm.patchValue({
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          category: product.category,
          imageUrl: product.imageUrl
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.toast.error('Failed to load product. Please try again.')
        this.isLoading = false;
      }
    });
  }

  loadCategories(): void {
    this.isCategoryLoading = true;
    this.productService.getCategories().subscribe({
      next: (categories: string[]) => {
        this.categories = categories;
        this.isCategoryLoading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.toast.error('Failed to load categories. Please try again.')
        this.isCategoryLoading = false;
      }
    });
  }

  onCategoryChange(): void {
    const selectedCategory = this.productForm.get('category')?.value;
    if (selectedCategory !== 'Other') {
      this.productForm.get('customCategory')?.setValue('');
    }
  }


  onSubmit(): void {
    if (this.productForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.productForm.controls).forEach(key => {
        this.productForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    const productData = this.productForm.value;

    if (productData.category === 'Other') {
      productData.category = productData.customCategory?.trim();
    }


    if (this.isNewProduct) {
      // Create new product
      this.adminService.addProduct(productData).subscribe({
        next: (response) => {
          this.toast.success('Product added successfully!')
          this.isSubmitting = false;

          // Navigate to product list after a short delay
          setTimeout(() => {
            this.router.navigate(['/admin/viewproducts']);
          }, 1500);
        },
        error: (error) => {
          console.error('Error adding product:', error);
          this.toast.error(error.error || `Failed to add product. Please try again.`)
          this.isSubmitting = false;
        }
      });
    } else {
      // Update existing product
      this.adminService.updateProduct(this.productId, productData).subscribe({
        next: (response) => {
          this.toast.success('Product updated successfully!')
          this.isSubmitting = false;

          // Optionally navigate back to product list after a short delay
          setTimeout(() => {
            this.router.navigate(['/admin/viewproducts']);
          }, 1500);
        },
        error: (error) => {
          console.error('Error updating product:', error);
          this.toast.error(error.error || `Failed to update product. Please try again.`)
          this.isSubmitting = false;
        }
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  goBack(): void {
    this.router.navigate(['/admin/viewproducts']);
  }

  onDescriptionGenerated(description: string): void {
    this.productForm.patchValue({ description });
    this.productForm.get('description')?.markAsTouched();
  }

  generateDescriptionWithAI(): void {
    const name = this.productForm.get('name')?.value;
    const category = this.productForm.get('category')?.value;
    const currentDescription = this.productForm.get('description')?.value || '';

    if (!name) {
      // Optionally show an error if no product name is provided
      this.toast.error(`Please enter a product name before generating a description.`)
      return;
    }

    this.isGeneratingDescription = true;

    // Create a prompt that includes product name, category, and any existing description content
    let enhancedPrompt = 'Generate a detailed product description for e-commerce';

    enhancedPrompt += ` for a product named "${name}"`;

    if (category) {
      enhancedPrompt += ` in the category "${category}"`;
    }

    if (currentDescription.trim()) {
      enhancedPrompt += `. Use these details as reference: ${currentDescription}`;
    }

    // Add specific instructions for the AI
    enhancedPrompt += `. The description should be:
    - Around 100-150 words
    - Highlight key features and benefits
    - Use persuasive language appropriate for e-commerce
    - Include relevant details for this type of product
    - Avoid placeholder text or generic statements
    - Write in a professional tone`;

    this.geminiService.getAiResponse(enhancedPrompt)
      .then(response => {
        // Clean up the response (remove quotes if present)
        const cleanedResponse = response.replace(/^["']|["']$/g, '');
        // Update the description field
        this.productForm.patchValue({ description: cleanedResponse });
        this.productForm.get('description')?.markAsTouched();
        this.isGeneratingDescription = false;
      })
      .catch(error => {
        console.error('Error generating description:', error);
        this.toast.error('Failed to generate description. Please try again.')
        this.isGeneratingDescription = false;
      });
  }

}
