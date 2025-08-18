import { Injectable } from '@angular/core';
import { DownPaymentOption, FinancingCalculation, PaymentPlan } from '../models/proposal.model';

@Injectable({
  providedIn: 'root'
})
export class FinancingCalculatorService {

   
  private readonly SOAT_FEE = 65; // S/.
  private readonly NOTARIAL_FEE = 180; // S/.
  private readonly PROCESSING_FEE = 120; // S/.
  private readonly TEA = 0.42; // 42% anual
  
  calculateFinancing(proposedPrice: number): FinancingCalculation {
    const totalPrice = proposedPrice + this.SOAT_FEE + 
                      this.NOTARIAL_FEE + this.PROCESSING_FEE;
    
    const downPaymentOptions = this.getDownPaymentOptions(totalPrice);
    
    return {
      basePrice: proposedPrice,
      soatPrice: this.SOAT_FEE,
      notarialTransfer: this.NOTARIAL_FEE,
      processingFees: this.PROCESSING_FEE,
      totalPrice,
      downPaymentOptions,
      financingOptions: []
    };
  }
  
  private getDownPaymentOptions(totalPrice: number): DownPaymentOption[] {
    const percentages = [0.15, 0.20, 0.25, 0.30]; // 15%, 20%, 25%, 30%
    
    return percentages.map(percentage => {
      const downPayment = Math.round(totalPrice * percentage);
      const financedAmount = totalPrice - downPayment;
      
      return {
        amount: downPayment,
        percentage: percentage * 100,
        financedAmount,
        plans: this.calculatePaymentPlans(financedAmount)
      };
    });
  }
  
  private calculatePaymentPlans(financedAmount: number): PaymentPlan[] {
    const fortnightOptions = [16, 20, 24];
    const fortnightlyRate = Math.pow(1 + this.TEA, 1/24) - 1; // Tasa quincenal
    
    return fortnightOptions.map(fortnights => {
      const payment = this.calculateFortnightlyPayment(
        financedAmount, 
        fortnightlyRate, 
        fortnights
      );
      
      const totalInterest = (payment * fortnights) - financedAmount;
      
      return {
        fortnights,
        fortnightlyPayment: Math.round(payment),
        totalInterest: Math.round(totalInterest),
        tea: this.TEA
      };
    });
  }
  
  private calculateFortnightlyPayment(
    principal: number, 
    rate: number, 
    periods: number
  ): number {
    return principal * (rate * Math.pow(1 + rate, periods)) / 
           (Math.pow(1 + rate, periods) - 1);
  }
  
}
