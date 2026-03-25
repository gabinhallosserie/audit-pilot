declare module "jspdf-autotable" {
  import { jsPDF } from "jspdf";
  
  interface AutoTableOptions {
    startY?: number;
    head?: any[][];
    body?: any[][];
    headStyles?: any;
    bodyStyles?: any;
    columnStyles?: any;
    didParseCell?: (data: any) => void;
    margin?: any;
  }

  export default function autoTable(doc: jsPDF, options: AutoTableOptions): void;
}
