import { ChecklistDNI } from "./checklist-dni";
import { ChecklistRecibo } from "./checklist-recibo";
import { ChecklistSelfie } from "./checklist-selfie";

export interface ChecklistEvaluacion {
    readonly dni?: ChecklistDNI;
  readonly recibo?: ChecklistRecibo;
  readonly selfie?: ChecklistSelfie;
}
