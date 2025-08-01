export interface IMenu {


        title: string   
        name: string
        icon: string
        route: string
        resumen?: string
        children?: IMenu[]

    }

    export const MENU: IMenu[] = [
        {
            title : 'inicio',
            name : 'dashboard',
            icon : 'dashboard',
            route : '/dashboard/panelmain',
            resumen :' pagina principal del sistema'
        },

        {
            title : 'aliados',
            name : 'aliado comercial',
            icon : 'group',
            route : '/dashboard/vendedores',
            resumen: 'gestion de aliados comerciales'
        },

        {
            title : 'tiendas',
            name : 'gestion',
            icon : 'house',
            route : '/dashboard/tiendas',
            resumen: 'gestion de tiendas asociadas'
        },
        {
            title : 'Motocicletas',
            name : 'gestion de productos',
            icon : 'directions_bike',
            route : '/dashboard/motocicletas',
            resumen: 'gestion de productos en  inventario'
        },
        {
            title : 'configuracion',
            name : 'web front-end',
            icon : 'settings',
            route : '/dashboard/config-web',
            resumen: 'configuracion de la pagina web'
        },
        {
            title : 'usuarios',
            name : 'gestion de usuarios',
            icon : 'group',
            route : '/dashboard/gestion-usuarios',
            resumen: 'gestion de usuarios del sistema'
        },
        {
            title : 'reportes',
            name : 'reportes',
            icon : 'bar_chart',
            route : '/dashboard/reportes',
            resumen: 'gestion de reportes'
        },
        {
            title : 'chat-aliados',
            name : 'chat aliados',
            icon : 'bar_chart',
            route : '/dashboard/chat-aliados',
            resumen: 'gestion de reportes'
        }

        

        

        


        

        
    ]