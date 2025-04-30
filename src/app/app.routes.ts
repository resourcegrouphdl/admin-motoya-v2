import { Routes } from '@angular/router';
import { HomeComponent } from './main_module/home/home.component';
import { RegistroComponent } from './inventario_module/registro/registro.component';
import { CrearProductoComponent } from './inventario_module/crear-producto/crear-producto.component';
import { ModuloProductoComponent } from './inventario_module/modulo-producto/modulo-producto.component';
import { ProximamenteComponent } from './common/proximamente/proximamente.component';
import { CrearFichaTecnicaComponent } from './inventario_module/crear-ficha-tecnica/crear-ficha-tecnica.component';


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
    component: ProximamenteComponent,
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
    component: ProximamenteComponent,
    data: {
      title: 'Web',
    },
  }
];
