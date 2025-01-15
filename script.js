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

                // Processar texto e filtrar títulos
                const pageRows = processPageText(textContent.items);
                extractedData.push(...pageRows);
            }

            generateExcel(extractedData);
        } catch (error) {
            console.error('Erro ao processar o PDF:', error);
            alert('Erro ao processar o PDF. Verifique o arquivo e tente novamente.');
        }
    };

    reader.readAsArrayBuffer(file);
}

function processPageText(items) {
    const rows = [];
    const columnsByY = {};

    // Agrupar itens pela posição Y
    items.forEach(item => {
        const currentY = Math.round(item.transform[5]); // Posição Y
        const currentX = Math.round(item.transform[4]); // Posição X

        if (!columnsByY[currentY]) {
            columnsByY[currentY] = [];
        }

        columnsByY[currentY].push({ x: currentX, text: item.str });
    });

    // Processar linhas agrupadas
    Object.keys(columnsByY).sort((a, b) => b - a).forEach(y => {
        const row = columnsByY[y]
            .sort((a, b) => a.x - b.x) // Ordenar por posição X
            .map(item => item.text.trim());
        rows.push(row);
    });

    // Filtrar linhas que sejam títulos ou irrelevantes
    return rows
        .filter(row => isDataRow(row)) // Apenas linhas com dados relevantes
        .map(row => row.filter(cell => cell !== '')); // Remover células vazias
}

function isDataRow(row) {
    // Palavras-chave que indicam títulos (excluir essas linhas)
    const titleKeywords = ['Código', 'Descrição', 'Preço', 'Desativado', 'Delivery', 'Balcão', 'Aliquota', 'Serviço'];

    // Verificar se a linha contém alguma palavra-chave
    if (row.some(cell => titleKeywords.includes(cell))) {
        return false;
    }

    // Verificar se a linha tem dados suficientes (número mínimo de colunas)
    return row.length > 3; // Ajuste conforme necessário
}

function generateExcel(data) {
    // Adicionar cabeçalhos dinâmicos (caso necessário)
    const headers = detectHeaders(data);

    // Adicionar cabeçalhos ao início dos dados
    const worksheetData = [headers, ...data];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PDF_Data');

    const excelData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    const linkContainer = document.getElementById('excel-link-container');
    linkContainer.innerHTML = '';

    const link = document.createElement('a');
    link.href = url;
    link.download = 'PDF_to_Excel_Somente_Dados.xlsx';
    link.textContent = 'Baixar Excel';
    link.classList.add('sql-link');

    linkContainer.appendChild(link);
}

function detectHeaders(data) {
    const maxColumns = Math.max(...data.map(row => row.length));
    return Array.from({ length: maxColumns }, (_, i) => `Coluna ${i + 1}`);
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
