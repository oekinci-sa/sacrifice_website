import { Row } from "@tanstack/react-table";

// Türkçe dil desteği ile metin sıralaması
const turkishCollator = new Intl.Collator('tr-TR');

export const sortingFunctions = {
  // Metinsel sıralama - Türkçe karakterler dahil
  text: (rowA: Row<any>, rowB: Row<any>, columnId: string): number => {
    const valueA = rowA.getValue(columnId) as string;
    const valueB = rowB.getValue(columnId) as string;
    
    if (!valueA) return 1;
    if (!valueB) return -1;
    
    return turkishCollator.compare(valueA.toString(), valueB.toString());
  },
  
  // Sayısal sıralama
  number: (rowA: Row<any>, rowB: Row<any>, columnId: string): number => {
    const valueA = parseFloat(rowA.getValue(columnId) as string);
    const valueB = parseFloat(rowB.getValue(columnId) as string);
    
    if (isNaN(valueA)) return 1;
    if (isNaN(valueB)) return -1;
    
    return valueA - valueB;
  },
  
  // Tarih sıralaması
  date: (rowA: Row<any>, rowB: Row<any>, columnId: string): number => {
    const valueA = new Date(rowA.getValue(columnId) as string).getTime();
    const valueB = new Date(rowB.getValue(columnId) as string).getTime();
    
    if (isNaN(valueA)) return 1;
    if (isNaN(valueB)) return -1;
    
    return valueA - valueB;
  },
  
  // Özel sıralama - Ödeme yüzdesi gibi
  paymentPercentage: (rowA: Row<any>, rowB: Row<any>): number => {
    const paidA = parseFloat(rowA.original.paid_amount.toString());
    const totalA = parseFloat(rowA.original.total_amount.toString());
    const ratioA = totalA > 0 ? (paidA / totalA) * 100 : 0;
    
    const paidB = parseFloat(rowB.original.paid_amount.toString());
    const totalB = parseFloat(rowB.original.total_amount.toString());
    const ratioB = totalB > 0 ? (paidB / totalB) * 100 : 0;
    
    return ratioA - ratioB;
  }
}; 