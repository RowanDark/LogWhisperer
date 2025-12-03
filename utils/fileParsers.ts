// Simple utility to extract readable strings from binary data (simulating strings command)
export const extractStringsFromBinary = (buffer: ArrayBuffer): string => {
  const view = new Uint8Array(buffer);
  let result = "";
  let currentString = "";

  for (let i = 0; i < Math.min(view.length, 50000); i++) { // Limit to first 50KB for performance
    const charCode = view[i];
    // Check for printable ASCII characters
    if (charCode >= 32 && charCode <= 126) {
      currentString += String.fromCharCode(charCode);
    } else {
      if (currentString.length > 4) { // Only keep strings longer than 4 chars
        result += currentString + "\n";
      }
      currentString = "";
    }
  }
  return result;
};

export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else if (result instanceof ArrayBuffer) {
        // Fallback for binary types if readAsText wasn't used or failed logic
        resolve(extractStringsFromBinary(result));
      }
    };

    reader.onerror = (error) => reject(error);

    if (file.name.endsWith('.pcap') || file.name.endsWith('.pcapng')) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
};

export const detectFileType = (fileName: string): string => {
  if (fileName.endsWith('.pcap') || fileName.endsWith('.pcapng')) return 'PCAP (Packet Capture)';
  if (fileName.endsWith('.log')) return 'Log File';
  if (fileName.endsWith('.csv')) return 'CSV Data';
  if (fileName.endsWith('.json')) return 'JSON Data';
  return 'Text File';
};