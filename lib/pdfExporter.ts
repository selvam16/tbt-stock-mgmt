import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { formatters } from "./formatters";
import { Company, GodownStock, Item, Party } from "./storage";

interface TransactionDetail {
    stock: GodownStock;
    item: Item | null;
    company: Company | null;
    party: Party | null;
    type: "load" | "unload";
}

interface ExportOptions {
    godownName: string;
    transactions: TransactionDetail[];
    filterFromDate?: Date | null;
    filterToDate?: Date | null;
    selectedPartyId?: string | null;
    selectedCompanyId?: string | null;
    parties?: Party[];
    companies?: Company[];
}

export async function exportTransactionsToPDF(options: ExportOptions) {
    const {
        godownName,
        transactions,
        filterFromDate,
        filterToDate,
        selectedPartyId,
        selectedCompanyId,
        parties = [],
        companies = [],
    } = options;

    try {
        // Generate HTML content for PDF
        const selectedParty = parties.find((p) => p.id === selectedPartyId);
        const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

        const filterInfo = `
      <div style="margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #ddd;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Applied Filters:</h3>
        ${filterFromDate
                ? `<p style="margin: 5px 0;"><strong>From Date:</strong> ${filterFromDate.toLocaleDateString()}</p>`
                : ""
            }
        ${filterToDate
                ? `<p style="margin: 5px 0;"><strong>To Date:</strong> ${filterToDate.toLocaleDateString()}</p>`
                : ""
            }
        ${selectedParty ? `<p style="margin: 5px 0;"><strong>Party:</strong> ${selectedParty.name}</p>` : ""}
        ${selectedCompany ? `<p style="margin: 5px 0;"><strong>Company:</strong> ${selectedCompany.companyName}</p>` : ""}
        ${!filterFromDate && !filterToDate && !selectedPartyId && !selectedCompanyId ? '<p style="margin: 5px 0; color: #666;"><em>No filters applied</em></p>' : ""}
      </div>
    `;

        const transactionsHTML = transactions
            .map(
                (txn) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px; text-align: center;">${txn.type === "load" ? "📦 LOAD" : "📋 UNLOAD"}</td>
        <td style="padding: 10px;">${formatters.date(txn.stock.date)}</td>
        <td style="padding: 10px;">${txn.party?.name || "Unknown"}</td>
        <td style="padding: 10px;">${txn.company?.companyName || "Unknown"}</td>
        <td style="padding: 10px;">${txn.item?.itemName || "Unknown"}</td>
        <td style="padding: 10px; text-align: right; font-weight: bold;">
          <span style="color: ${txn.type === "load" ? "#ef4444" : "#22c55e"};">
            ${txn.type === "load" ? "-" : "+"}${Math.abs(txn.stock.loadedQuantity)}
          </span>
        </td>
        <td style="padding: 10px;">${txn.stock.vehicleNumber || "-"}</td>
      </tr>
    `,
            )
            .join("");

        const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Stock Details - ${godownName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            h1 { color: #2563eb; margin-bottom: 10px; }
            h2 { color: #555; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f3f4f6; padding: 10px; text-align: left; font-weight: bold; border-bottom: 2px solid #d1d5db; }
            td { padding: 10px; }
            .empty { color: #999; font-style: italic; padding: 20px; text-align: center; }
            .summary { background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .summary-item { margin: 8px 0; }
            .summary-label { font-weight: bold; color: #555; }
            .summary-value { color: #2563eb; font-size: 18px; margin-left: 10px; }
          </style>
        </head>
        <body>
          <h1>Stock Details Report</h1>
          <p><strong>Godown:</strong> ${godownName}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          
          ${filterInfo}
          
          <h2>Transactions</h2>
          ${transactions.length === 0
                ? '<div class="empty">No transactions to display</div>'
                : `
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Party</th>
                  <th>Company</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Vehicle</th>
                </tr>
              </thead>
              <tbody>
                ${transactionsHTML}
              </tbody>
            </table>
          `
            }
        </body>
      </html>
    `;

        // Generate PDF
        const { uri } = await Print.printToFileAsync({
            html: htmlContent,
            base64: false,
        });

        // Share/download the PDF
        // Filename format: godown_partyname_timestamp.pdf
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
        const partyNameSanitized = selectedParty
            ? selectedParty.name.replace(/\s+/g, "_").toLowerCase()
            : "no_party";
        const godownNameSanitized = godownName.replace(/\s+/g, "_").toLowerCase();
        const pdfFilename = `${godownNameSanitized}_${partyNameSanitized}_${timestamp}.pdf`;

        // Save PDF to documents directory with correct filename
        const documentsDir = FileSystem.documentDirectory;
        const pdfPath = `${documentsDir}${pdfFilename}`;

        // Copy the generated PDF to our desired location with the correct filename
        await FileSystem.copyAsync({
            from: uri,
            to: pdfPath,
        });

        // Share the file
        await Sharing.shareAsync(pdfPath, {
            mimeType: "application/pdf",
            dialogTitle: "Stock Details PDF",
            UTI: "com.adobe.pdf",
        });

        return { success: true, uri };
    } catch (error) {
        console.error("Error generating PDF:", error);
        throw error;
    }
}
