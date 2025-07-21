export interface Vendedor {

    id:string;
    nombre:string;
    apellido:string;
    telefono1:string;
    telefono2:string;
    correo:string;
    contrasena:string
    direccion:string;
    imgenPerfil:string;
    tienda?:Tienda; // Puede ser un ID de tienda o un objeto de tienda
   
}

export interface Tienda {
    id: string;
    nombre: string;
}