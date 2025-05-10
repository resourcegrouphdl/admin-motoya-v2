export interface ListaDePreciosColaboradores {

    marca:string;
    modelo:string;
    precioPublico:string;
    tablaDeCuotas:PreciosDeCuotas[];
    actualizado:string;

}

export interface PreciosDeCuotas {
    
    inicial: string;
    montoPorCuotasTipoA: string;
    montoPorCuotasTipoB: string;
    montoPorCuotasTipoC: string;
    fechaDeCreacion: string;
    aliadoAsignado: Aliado[];
    
}

export interface Aliado {
    idReerencial:string,
    apellido:string
}