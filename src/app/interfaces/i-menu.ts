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
            route : '/',
            resumen :' pagina principal del sistema'
        },

        {
            title : 'aliados',
            name : 'aliado comercial',
            icon : 'group',
            route : '/vendedores',
            resumen: 'gestion de aliados comerciales'
        },

        {
            title : 'tiendas',
            name : 'gestion',
            icon : 'house',
            route : '/clientes',
            resumen: 'gestion de tiendas asociadas'
        },
        {
            title : 'Motocicletas',
            name : 'gestion de productos',
            icon : 'directions_bike',
            route : '/productos',
            resumen: 'gestion de productos en  inventario'
        },

        


        

        
    ]