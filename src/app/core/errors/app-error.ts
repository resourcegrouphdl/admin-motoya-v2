export class AppError extends Error {
    
  constructor(public readonly code:string, public override readonly message: string) {
    super(message);
    this.name = 'AppError';
  }
}