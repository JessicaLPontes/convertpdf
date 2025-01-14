async function handlePdfFile(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('Por favor, selecione um arquivo PDF.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function () {
        try {
            const pdfData = new Uint8Array(reader.result);
            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

            const extractedData = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();

                // Reestruturando para linhas lógicas
                const pageLines = groupTextByLine(textContent.items);
                extractedData.push(...pageLines.map(line => ({ Página: i, Linha: line })));
            }

            generateExcel(extractedData);
        } catch (error) {
            console.error('Erro ao processar o PDF:', error);
            alert('Erro ao processar o PDF. Verifique o arquivo e tente novamente.');
        }
    };

    reader.readAsArrayBuffer(file);
}

function groupTextByLine(items) {
    const lines = [];
    let currentLine = [];
    let lastY = null;

    items.forEach(item => {
        const currentY = Math.round(item.transform[5]); // Posição Y arredondada
        if (lastY !== null && Math.abs(currentY - lastY) > 5) {
            // Linha nova detectada
            lines.push(currentLine.join(' '));
            currentLine = [];
        }
        currentLine.push(item.str);
        lastY = currentY;
    });

    if (currentLine.length > 0) {
        lines.push(currentLine.join(' ')); // Adiciona a última linha
    }

    return lines;
}

function generateExcel(data) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PDF_Data');

    const excelData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    const linkContainer = document.getElementById('excel-link-container');
    linkContainer.innerHTML = '';

    const link = document.createElement('a');
    link.href = url;
    link.download = 'PDF_to_Excel_Ordenado.xlsx';
    link.textContent = 'Baixar Excel';
    link.classList.add('sql-link');

    linkContainer.appendChild(link);
}

function clearFiles() {
    document.getElementById('pdf-input').value = '';
    document.getElementById('excel-link-container').innerHTML = '';
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    const icon = document.querySelector('#theme-toggle i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
}
