/**
 * Text formatting utilities to normalize display across the app
 */

export const formatters = {
    // Party formatters
    partyName: (name?: string) => (name || "").toUpperCase(),
    partyTitle: (title?: string) => (title || "").toUpperCase(),

    // Company formatters
    companyName: (name?: string) => (name || "").toUpperCase(),
    agentName: (name?: string) => (name || "").toUpperCase(),
    godownName: (name?: string) => (name || "").toUpperCase(),
    companySource: (source?: string) => (source || "").toUpperCase(),

    // Item formatters
    itemName: (name?: string) => (name || "").toUpperCase(),

    // Vehicle formatters
    vehicleNumber: (number?: string) => (number || "").toUpperCase(),
    vehicleNameBoard: (name?: string) => (name || "").toUpperCase(),
    vehicleType: (type?: string) => (type || "").toUpperCase(),
    deliveryLocation: (location?: string) => (location || "").toUpperCase(),

    // Generic text formatter
    text: (text?: string) => (text || "").toUpperCase(),

    // Label formatters (for all caps labels)
    label: (label: string) => label.toUpperCase(),

    // Date formatter - converts YYYY-MM-DD to DD-MMM-YY format (e.g., 10-MAR-26)
    date: (dateString?: string) => {
        if (!dateString) return "";
        const [year, month, day] = dateString.split("-");
        if (!year || !month || !day) return dateString;

        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
            "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const monthIndex = parseInt(month) - 1;
        const monthAbbr = monthNames[monthIndex] || "";
        const yearShort = year.slice(-2);

        return `${day}-${monthAbbr}-${yearShort}`;
    },

    // Date object formatter - converts Date object to DD-MMM-YY format (e.g., 10-MAR-26)
    dateFromObject: (dateObj?: Date) => {
        if (!dateObj) return "";
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
            "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const day = String(dateObj.getDate()).padStart(2, "0");
        const monthAbbr = monthNames[dateObj.getMonth()];
        const yearShort = String(dateObj.getFullYear()).slice(-2);

        return `${day}-${monthAbbr}-${yearShort}`;
    },
};
