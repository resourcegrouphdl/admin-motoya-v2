import { Routes } from '@angular/router';
import { HomeComponent } from './main_module/home/home.component';
import { RegistroComponent } from './inventario_module/registro/registro.component';
import { CrearProductoComponent } from './inventario_module/crear-producto/crear-producto.component';
import { ModuloProductoComponent } from './inventario_module/modulo-producto/modulo-producto.component';
import { ProximamenteComponent } from './common/proximamente/proximamente.component';
import { CrearFichaTecnicaComponent } from './inventario_module/crear-ficha-tecnica/crear-ficha-tecnica.component';
import { ReportesHomeComponent } from './reportes/reportes-home/reportes-home.component';
import { ReportesClientesComponent } from './reportes/reportes-clientes/reportes-clientes.component';
import { ColaboradoresHomeComponent } from './colaboradores/colaboradores-home/colaboradores-home.component';
import { TiendasComponent } from './colaboradores/tiendas/tiendas.component';
import { CrearColaboradoresComponent } from './colaboradores/crear-colaboradores/crear-colaboradores.component';
import { ListaVendedoresComponent } from './colaboradores/lista-vendedores/lista-vendedores.component';
import { CrearVendedorComponent } from './colaboradores/crear-vendedor/crear-vendedor.component';
import { ListaDePreciosWebComponent } from './web_config_module/lista-de-precios-web/lista-de-precios-web.component';
import { FrontConfigComponent } from './web_config_module/front-config/front-config.component';
import { LoadingComponent } from './common/loading/loading.component';
import { LoginComponent } from './auth_module/login/login.component';
import { authGuard } from './guardas/auth.guard';
import { DashboardComponent } from './main_module/dashboard/dashboard.component';
import { DetallesAsociadosATiendaComponent } from './colaboradores/detalles-asociados-atienda/detalles-asociados-atienda.component';
import { ChatComponent } from './common/chat/chat.component';
import { MainadminComponent } from './modulos/adminusuarios/mainadmin/mainadmin.component';
import { ListarComponent } from './modulos/adminusuarios/listar/listar.component';
import { CrearComponent } from './modulos/adminusuarios/crear/crear.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: LoadingComponent,
    data: {
      title: 'Home',
    },
  },
  {
    path: 'login',

    component: LoginComponent,
    data: {
      title: 'Login',
    },
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    component: HomeComponent,
    data: {
      title: 'Dashboard',
    },
    children: [
      {
        path: '',
        redirectTo: 'panelmain',
        pathMatch: 'full',
      },
      {
        path: 'panelmain',
        component: DashboardComponent,
        data: {
          title: 'panel inicial',
        },
      },
      {
        path: 'vendedores',
        component: ListaVendedoresComponent,
        data: {
          title: 'Vendedores',
        },
      },
      {
        path: 'tiendas',
        component: ColaboradoresHomeComponent,
        data: {
          title: 'Tiendas',
        },
        children: [
          {
            path: '',
            redirectTo: 'list-tiendas',
            pathMatch: 'full',
          },
          {
            path: 'list-tiendas',
            component: TiendasComponent,
          },

          {
            path: 'crear-tienda',
            component: CrearColaboradoresComponent,
          },
          {
            path: 'info-tienda',
            component: DetallesAsociadosATiendaComponent,
          },
        ],
      },
      {
        path: 'motocicletas',
        component: ModuloProductoComponent,
        children: [
          {
            path: '',
            redirectTo: 'nuevo',
            pathMatch: 'full',
          },
          {
            path: 'nuevo',
            component: RegistroComponent,
            data: {
              title: 'nuevo',
            },
          },
          {
            path: 'crear',
            component: CrearProductoComponent,
            data: {
              title: 'crear',
            },
          },
          {
            path: 'crear-ficha-tecnica',
            component: CrearFichaTecnicaComponent,
            data: {
              title: 'modificar',
            },
          },
        ],
      },

      {
        path: 'config-web',
        component: FrontConfigComponent,
        data: {
          title: 'Config Web',
        },
      },
      {
        path: 'gestion-usuarios',
        component: MainadminComponent,
        children: [
          {
            path: '',
            redirectTo: 'list-usuarios',
            pathMatch: 'full',
          },
          {
            path: 'list-usuarios',
            component: ListarComponent,
          },
          {
            path: 'crear-usuario',
            component: CrearComponent,
          },
          {
            path: 'modificar-usuario/:id',
            component: CrearComponent,
          }
        ]
      },
      {
        path: 'reportes',
        component: ReportesHomeComponent,
        children: [
          {
            path: '',
            redirectTo: 'report-client',
            pathMatch: 'full',
          },
          {
            path: 'report-client',
            component: ReportesClientesComponent,
            data: {
              title: 'Report Client',
            },
          },
        ],
      },
      {
        path: 'chat-aliados',
        component: ChatComponent,
      }
    ],
  },
  {
    path: 'colaboradores',
    component: ColaboradoresHomeComponent,
    data: {
      title: 'Colaboradores',
    },
    children: [
      {
        path: '',
        redirectTo: 'list-colaboradores',
        pathMatch: 'full',
      },
      {
        path: 'list-colaboradores',
        component: TiendasComponent,
      },

      {
        path: 'modificar-colaborador',
        component: ProximamenteComponent,
      },
      {
        path: 'list-aliados',
        component: ListaVendedoresComponent,
      },
      {
        path: 'crear-aliado',
        component: CrearVendedorComponent,
      },
    ],
  },

  {
    path: 'web',
    component: FrontConfigComponent,
    data: {
      title: 'Web',
    },
  },
];
