export interface IMenu {

    name: string
    icon: string
    route: string
    children?: IMenu[]

}

export const menu: IMenu[] = [
    {
        name : 'Inventario',
        icon : 'inventory_2',
        route : '/inventario',
        children : [
            {
                name : 'Agregar',
                icon : 'add',
                route : '/inventario/agregar'
            },
            
            {
                name : 'Actualizar',
                icon : 'update',
                route : '/inventario/actualizar'
            },
            
        ]
    },
    {
        name : 'Ventas',
        icon : 'shopping_cart',
        route : '/ventas',
        children : [
            {
                name : 'Registrar',
                icon : 'add_shopping_cart',
                route : '/ventas/registrar'
            },
            {
                name : 'Facturar',
                icon : 'receipt',
                route : '/ventas/facturar'
            },
            {
                name : 'Seguimiento',
                icon : 'track_changes',
                route : '/ventas/seguimiento'
            }
        ]
    },
    {
        name : 'Créditos',
        icon : 'credit_card',
        route : '/creditos',
        children : [
            {
                name : 'Evaluación',
                icon : 'assessment',
                route : '/creditos/evaluacion'
            },
            {
                name : 'Seguimiento',
                icon : 'track_changes',
                route : '/creditos/seguimiento'
            },
            {
                name : 'Historial',
                icon : 'history',
                route : '/creditos/historial'
            }
        ]
    },
    {
        name : 'Clientes',
        icon : 'people',
        route : '/clientes',
        children : [
            {
                name : 'Registro',
                icon : 'person_add',
                route : '/clientes/registro'
            },
            {
                name : 'Historial',
                icon : 'history',
                route : '/clientes/historial'
            },
            {
                name : 'Preferencias',
                icon : 'favorite',
                route : '/clientes/preferencias'
            }
        ]
    },
    {
        name : 'Promoción de Créditos',
        icon : 'card_giftcard',
        route : '/promocion',
        children : [
            {
                name : 'Crear',
                icon : 'add',
                route : '/promocion/crear'
            },
            {
                name : 'Gestionar',
                icon : 'settings',
                route : '/promocion/gestionar'
            }
        ]
    },
    {
        name : 'Secciones de la Página Web',
        icon : 'web',
        route : '/web',
        children : [
            {
                name : 'Administración',
                icon : 'settings',
                route : '/web/administracion'
            },
            {
                name : 'Actualizaciones',
                icon : 'update',
                route : '/web/actualizaciones'
            },
            {
                name : 'Promociones',
                icon : 'card_giftcard',
                route : '/web/promociones'
            }
        ]
    }

]

/* 1. Módulo de Gestión de Inventario
Funcionalidades: Agregar, eliminar, actualizar y consultar motocicletas en inventario.

Comunicación: Puede necesitar comunicarse con el módulo de ventas para actualizar el inventario.

2. Módulo de Gestión de Ventas
Funcionalidades: Registrar ventas, generar facturas, seguimiento de pedidos.

Comunicación: Necesita datos del inventario y del módulo de créditos para validar la disponibilidad y aprobación de crédito.

3. Módulo de Gestión de Créditos
Funcionalidades: Evaluación de crédito, seguimiento de pagos, historial de crédito del cliente.

Comunicación: Interacción con el módulo de ventas para aprobar créditos y con la sección de promoción para dar visibilidad a ofertas especiales.

4. Módulo de Gestión de Clientes
Funcionalidades: Registro de clientes, historial de compras, seguimiento de preferencia de productos.

Comunicación: Datos compartidos con los módulos de ventas y créditos para personalizar la experiencia y validar la identidad y el crédito.

5. Módulo de Promoción de Créditos
Funcionalidades: Crear y gestionar promociones de créditos, publicidad en la página web.

Comunicación: Integra con la sección de ventas y créditos para ofrecer promociones actuales y personalizadas.

6. Módulo de Gestión de Secciones de la Página Web
Funcionalidades: Administración de diferentes secciones de la página web, actualizaciones de contenido, promociones en línea.

Comunicación: Sincronización con el módulo de promoción de créditos para reflejar ofertas y descuentos.  */