import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private apiUrl = environment.deepseek.apiUrl;
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${environment.deepseek.apiKey}`,
  });

  private systemPrompt = `Eres el asistente virtual del H. Ayuntamiento de Guadalupe Victoria, Durango.
Tu función es ayudar a los ciudadanos con:
- Información sobre transparencia y obligaciones del Artículo 70
- Cómo realizar solicitudes ARCO (Acceso, Rectificación, Cancelación, Oposición)
- Trámites y servicios municipales
- Programas sociales disponibles
- Directorio de funcionarios públicos
- Marco normativo aplicable

Responde siempre de forma amable, clara y en español. Si no conoces la respuesta,
orienta al ciudadano a la Secretaría de Transparencia.
Contacto: transparencia@guadalupevictoria.gob.mx`;

  constructor(private http: HttpClient) {}

  async sendMessage(userMessage: string, history: ChatMessage[] = []): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: this.systemPrompt },
      ...history.slice(-10), // Últimos 10 mensajes de contexto
      { role: 'user', content: userMessage },
    ];

    const body = {
      model: 'deepseek-chat',
      messages,
      max_tokens: 500,
      temperature: 0.7,
    };

    const response = await firstValueFrom(
      this.http.post<any>(this.apiUrl, body, { headers: this.headers })
    );

    return response.choices[0]?.message?.content ?? 'No pude procesar tu pregunta. Intenta de nuevo.';
  }
}
