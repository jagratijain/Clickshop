import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private apiUrl = `${environment.apiUrl}/gemini`;

  constructor(
    private http: HttpClient
  ) { }

  async getAiResponse(prompt: string): Promise<string> {
    const response = await lastValueFrom(
      this.http.post<{ response: string }>(this.apiUrl, { prompt })
    );
    return response.response;
  }

  async getAiResponse_Agent(prompt: string): Promise<string> {
    const response = await lastValueFrom(
      this.http.post<{ response: string }>(this.apiUrl + "/products", { prompt })
    );
    console.log(response);
    return response.response;
  }

}
