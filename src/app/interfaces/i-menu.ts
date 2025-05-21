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

        


        

        
    ]