import { Routes } from '@angular/router';
import { HomeComponent } from './main_module/home/home.component';
import { RegistroComponent } from './inventario_module/registro/registro.component';
import { CrearProductoComponent } from './inventario_module/crear-producto/crear-producto.component';
import { ModuloProductoComponent } from './inventario_module/modulo-producto/modulo-producto.component';
import { ProximamenteComponent } from './common/proximamente/proximamente.component';
import { CrearFichaTecnicaComponent } from './inventario_module/crear-ficha-tecnica/crear-ficha-tecnica.component';
import { ReportesHomeComponent } from "./reportes/reportes-home/reportes-home.component";
import { ReportesClientesComponent } from "./reportes/reportes-clientes/reportes-clientes.component";
import { ColaboradoresHomeComponent } from './colaboradores/colaboradores-home/colaboradores-home.component';
import { TiendasComponent } from './colaboradores/tiendas/tiendas.component';
import { CrearColaboradoresComponent } from './colaboradores/crear-colaboradores/crear-colaboradores.component';
import { ListaVendedoresComponent } from './colaboradores/lista-vendedores/lista-vendedores.component';
import { CrearVendedorComponent } from './colaboradores/crear-vendedor/crear-vendedor.component';
import { ListaDePreciosWebComponent } from './web_config_module/lista-de-precios-web/lista-de-precios-web.component';
import { FrontConfigComponent } from './web_config_module/front-config/front-config.component';


export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: HomeComponent,
    data: {
      title: 'Home',
    },
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
        path: 'crear-colaborador',
        component: CrearColaboradoresComponent,
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
      

    ]
  },
  {
    path: 'inventario',
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
      }

    ],
  },
  {
    path: 'ventas',
    component: ProximamenteComponent,
    data: {
      title: 'Ventas',
    },
  },
  {
    path: 'creditos',
    component: ListaDePreciosWebComponent,
    data: {
      title: 'Créditos',
    },
  },
  {
    path: 'clientes',
    component: ProximamenteComponent,
    children: [
      {
        path: '',
        redirectTo: 'list-clientes',
        pathMatch: 'full',
      },
      {
        path: 'list-clientes',
        component: ProximamenteComponent,
        data: {
          title: 'List Clientes',
        },
      },

    ]


  },
  {
    path: 'promocion',
    component: ProximamenteComponent,
    data: {
      title: 'Promoción de Créditos',
    },

  },
  {
    path: 'web',
    component: FrontConfigComponent,
    data: {
      title: 'Web',
    },
  },
  {
    path:'reportes',
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
        }
      }

    ]
  }
];
