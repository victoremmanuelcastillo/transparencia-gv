import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ArcoService } from '../../core/services/arco.service';

type TipoARCO = 'acceso' | 'rectificacion' | 'cancelacion' | 'oposicion';
type Vista = 'info' | 'formulario' | 'consulta' | 'confirmacion';

interface FormSolicitud {
  tipo: TipoARCO;
  nombre: string;
  email: string;
  telefono: string;
  descripcion: string;
}

@Component({
  selector: 'app-solicitudes-arco',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './solicitudes-arco.component.html',
  styleUrl: './solicitudes-arco.component.css',
})
export class SolicitudesArcoComponent implements OnInit {
  private arco: ArcoService;

  vista = signal<Vista>('info');
  enviando = signal(false);
  error = signal<string | null>(null);
  folioGenerado = signal<string | null>(null);

  folioConsulta = '';
  resultadoConsulta: any = null;
  consultando = false;
  errorConsulta: string | null = null;

  form: FormSolicitud = {
    tipo: 'acceso',
    nombre: '',
    email: '',
    telefono: '',
    descripcion: '',
  };

  readonly tipos = [
    {
      value: 'acceso' as TipoARCO,
      label: 'Acceso',
      descripcion: 'Solicita conocer qué datos personales tuyos tiene el Ayuntamiento.',
      icono: '🔍',
    },
    {
      value: 'rectificacion' as TipoARCO,
      label: 'Rectificación',
      descripcion: 'Solicita corregir datos personales incorrectos o incompletos.',
      icono: '✏️',
    },
    {
      value: 'cancelacion' as TipoARCO,
      label: 'Cancelación',
      descripcion: 'Solicita que se eliminen tus datos personales de nuestros registros.',
      icono: '🗑️',
    },
    {
      value: 'oposicion' as TipoARCO,
      label: 'Oposición',
      descripcion: 'Solicita que cesen el uso de tus datos para fines específicos.',
      icono: '🚫',
    },
  ];

  constructor(arcoService: ArcoService) {
    this.arco = arcoService;
  }

  ngOnInit() {}

  irAFormulario(tipo?: TipoARCO) {
    if (tipo) this.form.tipo = tipo;
    this.vista.set('formulario');
  }

  volverAInfo() {
    this.vista.set('info');
    this.error.set(null);
  }

  async enviarSolicitud() {
    if (!this.form.nombre.trim() || !this.form.email.trim() || !this.form.descripcion.trim()) {
      this.error.set('Por favor completa todos los campos requeridos.');
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    try {
      const resultado = await this.arco.crearSolicitud(
        this.form.tipo,
        {
          nombre: this.form.nombre.trim(),
          email: this.form.email.trim(),
          telefono: this.form.telefono.trim() || undefined,
        },
        this.form.descripcion.trim()
      );
      this.folioGenerado.set((resultado as any).folio);
      this.vista.set('confirmacion');
    } catch (e: any) {
      this.error.set('Error al enviar la solicitud. Intenta de nuevo.');
    } finally {
      this.enviando.set(false);
    }
  }

  async consultarFolio() {
    if (!this.folioConsulta.trim()) return;
    this.consultando = true;
    this.errorConsulta = null;
    this.resultadoConsulta = null;

    try {
      const resultado = await this.arco.obtenerPorFolio(this.folioConsulta.trim().toUpperCase());
      if (resultado) {
        this.resultadoConsulta = resultado;
      } else {
        this.errorConsulta = 'No se encontró ninguna solicitud con ese folio.';
      }
    } catch {
      this.errorConsulta = 'Error al consultar. Verifica el folio e intenta de nuevo.';
    } finally {
      this.consultando = false;
    }
  }

  nueva() {
    this.form = { tipo: 'acceso', nombre: '', email: '', telefono: '', descripcion: '' };
    this.folioGenerado.set(null);
    this.vista.set('info');
  }

  labelTipo(tipo: string): string {
    return this.tipos.find(t => t.value === tipo)?.label ?? tipo;
  }

  labelEstatus(estatus: string): string {
    const map: Record<string, string> = {
      recibida: 'Recibida',
      en_proceso: 'En proceso',
      respondida: 'Respondida',
      cerrada: 'Cerrada',
    };
    return map[estatus] ?? estatus;
  }
}
