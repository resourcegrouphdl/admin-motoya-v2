import { Component, computed, inject, signal } from '@angular/core';
import { AdminFilters, AdminProposalService } from '../../../services/admin-proposal.service';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../../../../services/tienda/store.service';
import { StoreDetailsDialogComponent } from "../store-details-dialog/store-details-dialog.component";

export interface Proposal {
  id: string;
  uidTienda: string;
  marca: string;
  modelo: string;
  precio: number;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  fechaCreacion: string;
  fechaAprobacion?: string;
  motivoRechazo?: string;
  negociaciones: Negotiation[];
}

export interface Negotiation {
  id: string;
  mensaje: string;
  autor: 'tienda' | 'financiera';
  fecha: string;
}

export interface NewProposal {
  marca: string;
  modelo: string;
  precio: string;
}
@Component({
  selector: 'app-admin-proposal',
  standalone: true,
  imports: [CommonModule, FormsModule, StoreDetailsDialogComponent],
  templateUrl: './admin-proposal.component.html',
  styles: [`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
    .card-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
  `]
})
export class AdminProposalComponent {
public adminService = inject(AdminProposalService);
  public storeService = inject(StoreService);

  // Estado del componente
  public filters: AdminFilters = { estado: 'todos' };
  public showResponseId: string | null = null;
  public showRejectId: string | null = null;
  public responseMessage = '';
  public rejectReason = '';

  // Signals para el diálogo de tienda
  public showStoreDialog = signal<boolean>(false);
  public selectedStoreUid = signal<string>('');

  // Usuario actual (en una app real vendría del servicio de auth)
  private currentAdminUid = 'admin-user-id';

  constructor() {
    // Bind del método para el diálogo
    this.closeStoreDialog = this.closeStoreDialog.bind(this);
  }

  ngOnInit(): void {
    console.log('Inicializando componente administrativo');
    this.adminService.initializeAdminView(this.filters);
    
    // Ya no necesitamos precargar datos, el ExternalUserService ya los tiene
    console.log('Datos de tiendas disponibles desde ExternalUserService');
  }

  ngOnDestroy(): void {
    console.log('Destruyendo componente administrativo');
    this.adminService.stopAllListeners();
  }

  // Computed para propuestas filtradas
  filteredProposals = computed(() => {
    return this.adminService.proposals();
  });

  /**
   * Obtener nombre de tienda para mostrar en la lista - Ahora es sincrónico
   */
  getStoreName(uid: string): string {
    return this.storeService.getStoreName(uid);
  }

  /**
   * Abrir diálogo con detalles de la tienda
   */
  openStoreDialog(uid: string): void {
    console.log('Abriendo diálogo de tienda:', uid);
    this.selectedStoreUid.set(uid);
    this.showStoreDialog.set(true);
  }

  /**
   * Cerrar diálogo de tienda
   */
  closeStoreDialog(): void {
    console.log('Cerrando diálogo de tienda');
    this.showStoreDialog.set(false);
    this.selectedStoreUid.set('');
  }

  /**
   * Aplicar filtros
   */
  applyFilters(): void {
    console.log('Aplicando filtros:', this.filters);
    this.adminService.updateFilters(this.filters);
  }

  /**
   * Aprobar propuesta
   */
  async approveProposal(proposalId: string): Promise<void> {
    try {
      await this.adminService.approveProposal(proposalId, this.currentAdminUid);
      console.log('Propuesta aprobada exitosamente');
    } catch (error) {
      console.error('Error al aprobar propuesta:', error);
      alert('Error al aprobar la propuesta. Inténtalo de nuevo.');
    }
  }

  /**
   * Rechazar propuesta
   */
  async rejectProposal(proposalId: string): Promise<void> {
    if (!this.rejectReason.trim()) {
      alert('Por favor, proporciona un motivo para el rechazo.');
      return;
    }

    try {
      await this.adminService.rejectProposal(
        proposalId, 
        this.rejectReason.trim(), 
        this.currentAdminUid
      );
      
      // Limpiar formulario
      this.rejectReason = '';
      this.showRejectId = null;
      
      console.log('Propuesta rechazada exitosamente');
    } catch (error) {
      console.error('Error al rechazar propuesta:', error);
      alert('Error al rechazar la propuesta. Inténtalo de nuevo.');
    }
  }

  /**
   * Enviar respuesta de negociación
   */
  async sendResponse(proposalId: string): Promise<void> {
    if (!this.responseMessage.trim()) {
      alert('Por favor, escribe una respuesta.');
      return;
    }

    try {
      await this.adminService.addFinancialResponse(
        proposalId,
        this.responseMessage.trim(),
        this.currentAdminUid
      );
      
      // Limpiar formulario
      this.responseMessage = '';
      this.showResponseId = null;
      
      console.log('Respuesta enviada exitosamente');
    } catch (error) {
      console.error('Error al enviar respuesta:', error);
      alert('Error al enviar la respuesta. Inténtalo de nuevo.');
    }
  }

  /**
   * Recargar datos
   */
  reloadData(): void {
    console.log('Recargando datos administrativos');
    this.adminService.stopAllListeners();
    this.adminService.initializeAdminView(this.filters);
    // Ya no necesitamos limpiar cache, el ExternalUserService maneja los datos
  }

  /**
   * Obtener clase CSS para el borde según estado
   */
  getBorderClass(estado: string): string {
    const classes = {
      'pendiente': 'border-l-yellow-500',
      'aprobado': 'border-l-green-500',
      'rechazado': 'border-l-red-500'
    };
    return classes[estado as keyof typeof classes] || 'border-l-gray-500';
  }

  /**
   * Obtener clase CSS para el estado
   */
  getStatusClass(estado: string): string {
    const classes = {
      'pendiente': 'bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium',
      'aprobado': 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium',
      'rechazado': 'bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium'
    };
    return classes[estado as keyof typeof classes] || 'bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium';
  }

  /**
   * Obtener clase CSS para negociaciones
   */
  getNegotiationClass(autor: string): string {
    return autor === 'tienda' 
      ? 'bg-blue-50 border border-blue-200 rounded-lg p-3'
      : 'bg-green-50 border border-green-200 rounded-lg p-3';
  }
}