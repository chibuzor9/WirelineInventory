import puppeteer from 'puppeteer';
import { Tool, ReportType, ToolTag } from '@shared/schema';

interface ReportData {
    tools: Tool[];
    reportType: ReportType;
    tags: ToolTag[];
    startDate?: string;
    endDate?: string;
    generatedBy: string;
    generatedAt: Date;
}

export async function generateReportPDF(data: ReportData): Promise<Buffer> {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Set page size and margins
        await page.setViewport({ width: 1200, height: 800 });

        const html = generateReportHTML(data);
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Generate PDF with proper styling
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            },
            displayHeaderFooter: true,
            headerTemplate: `
                <div style="font-size: 10px; color: #666; width: 100%; text-align: center; margin: 0 20px;">
                    <span>Wireline Inventory Report - ${ data.reportType }</span>
                </div>
            `,
            footerTemplate: `
                <div style="font-size: 10px; color: #666; width: 100%; text-align: center; margin: 0 20px;">
                    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated on ${ data.generatedAt.toLocaleDateString() }</span>
                </div>
            `
        });

        return pdf;
    } finally {
        await browser.close();
    }
}

function generateReportHTML(data: ReportData): string {
    const { tools, reportType, tags, startDate, endDate, generatedBy, generatedAt } = data;

    // Filter tools based on tags if specified
    const filteredTools = tags.length > 0
        ? tools.filter(tool => tags.includes(tool.status as ToolTag))
        : tools;

    // Generate status summary
    const statusCounts = {
        red: filteredTools.filter(t => t.status === 'red').length,
        yellow: filteredTools.filter(t => t.status === 'yellow').length,
        green: filteredTools.filter(t => t.status === 'green').length,
        white: filteredTools.filter(t => t.status === 'white').length,
    };

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Wireline Inventory Report</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.4;
                    color: #333;
                    background: #fff;
                }
                
                .report-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #e5e7eb;
                }
                
                .report-title {
                    font-size: 24px;
                    font-weight: bold;
                    color: #1f2937;
                    margin-bottom: 8px;
                }
                
                .report-subtitle {
                    font-size: 14px;
                    color: #6b7280;
                    margin-bottom: 4px;
                }
                
                .report-meta {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 30px;
                    font-size: 12px;
                }
                
                .meta-section {
                    background: #f9fafb;
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                }
                
                .meta-title {
                    font-weight: bold;
                    margin-bottom: 8px;
                    color: #374151;
                }
                
                .status-summary {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 15px;
                    margin-bottom: 30px;
                }
                
                .status-card {
                    text-align: center;
                    padding: 15px;
                    border-radius: 8px;
                    border: 2px solid;
                }
                
                .status-red {
                    border-color: #dc2626;
                    background: rgba(220, 38, 38, 0.1);
                }
                
                .status-yellow {
                    border-color: #d97706;
                    background: rgba(217, 119, 6, 0.1);
                }
                
                .status-green {
                    border-color: #059669;
                    background: rgba(5, 150, 105, 0.1);
                }
                
                .status-white {
                    border-color: #6b7280;
                    background: rgba(107, 114, 128, 0.1);
                }
                
                .status-count {
                    font-size: 20px;
                    font-weight: bold;
                    margin-bottom: 4px;
                }
                
                .status-label {
                    font-size: 12px;
                    text-transform: uppercase;
                    font-weight: 500;
                }
                
                .tools-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                    font-size: 11px;
                }
                
                .tools-table th,
                .tools-table td {
                    border: 1px solid #e5e7eb;
                    padding: 8px;
                    text-align: left;
                }
                
                .tools-table th {
                    background: #f3f4f6;
                    font-weight: 600;
                    color: #374151;
                }
                
                .tools-table tr:nth-child(even) {
                    background: #f9fafb;
                }
                
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 500;
                    text-transform: uppercase;
                }
                
                .badge-red {
                    background: rgba(220, 38, 38, 0.1);
                    color: #dc2626;
                    border: 1px solid #dc2626;
                }
                
                .badge-yellow {
                    background: rgba(217, 119, 6, 0.1);
                    color: #d97706;
                    border: 1px solid #d97706;
                }
                
                .badge-green {
                    background: rgba(5, 150, 105, 0.1);
                    color: #059669;
                    border: 1px solid #059669;
                }
                
                .badge-white {
                    background: rgba(107, 114, 128, 0.1);
                    color: #6b7280;
                    border: 1px solid #6b7280;
                }
                
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    display: inline-block;
                    margin-right: 6px;
                }
                
                .dot-red { background: #dc2626; }
                .dot-yellow { background: #d97706; }
                .dot-green { background: #059669; }
                .dot-white { background: #6b7280; }
                
                .page-break {
                    page-break-before: always;
                }
                
                @media print {
                    .tools-table {
                        page-break-inside: auto;
                    }
                    
                    .tools-table tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                }
            </style>
        </head>
        <body>
            <div class="report-header">
                <div class="report-title">Wireline Inventory Report</div>
                <div class="report-subtitle">${ getReportTypeLabel(reportType) }</div>
                <div class="report-subtitle">Generated by ${ generatedBy } on ${ generatedAt.toLocaleDateString() }</div>
            </div>
            
            <div class="report-meta">
                <div class="meta-section">
                    <div class="meta-title">Report Parameters</div>
                    <div><strong>Type:</strong> ${ getReportTypeLabel(reportType) }</div>
                    <div><strong>Status Filter:</strong> ${ tags.length > 0 ? tags.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ') : 'All Statuses' }</div>
                    ${ startDate ? `<div><strong>Date From:</strong> ${ new Date(startDate).toLocaleDateString() }</div>` : '' }
                    ${ endDate ? `<div><strong>Date To:</strong> ${ new Date(endDate).toLocaleDateString() }</div>` : '' }
                </div>
                
                <div class="meta-section">
                    <div class="meta-title">Summary</div>
                    <div><strong>Total Tools:</strong> ${ filteredTools.length }</div>
                    <div><strong>Categories:</strong> ${ [...new Set(filteredTools.map(t => t.category))].length }</div>
                    <div><strong>Locations:</strong> ${ [...new Set(filteredTools.map(t => t.location).filter(Boolean))].length }</div>
                </div>
            </div>
            
            <div class="status-summary">
                <div class="status-card status-red">
                    <div class="status-count">${ statusCounts.red }</div>
                    <div class="status-label">Critical</div>
                </div>
                <div class="status-card status-yellow">
                    <div class="status-count">${ statusCounts.yellow }</div>
                    <div class="status-label">Warning</div>
                </div>
                <div class="status-card status-green">
                    <div class="status-count">${ statusCounts.green }</div>
                    <div class="status-label">Good</div>
                </div>
                <div class="status-card status-white">
                    <div class="status-count">${ statusCounts.white }</div>
                    <div class="status-label">Inactive</div>
                </div>
            </div>
            
            <table class="tools-table">
                <thead>
                    <tr>
                        <th>Tool ID</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Location</th>
                        <th>Last Updated</th>
                        ${ reportType === 'tag-status' ? '<th>Description</th>' : '' }
                    </tr>
                </thead>
                <tbody>
                    ${ filteredTools.map(tool => `
                        <tr>
                            <td>${ tool.toolId }</td>
                            <td>${ tool.name }</td>
                            <td>${ tool.category }</td>
                            <td>
                                <span class="status-badge badge-${ tool.status }">
                                    <span class="status-dot dot-${ tool.status }"></span>
                                    ${ tool.status.charAt(0).toUpperCase() + tool.status.slice(1) }
                                </span>
                            </td>
                            <td>${ tool.location || 'N/A' }</td>
                            <td>${ new Date(tool.lastUpdated).toLocaleDateString() }</td>
                            ${ reportType === 'tag-status' ? `<td>${ tool.description || 'N/A' }</td>` : '' }
                        </tr>
                    `).join('') }
                </tbody>
            </table>
        </body>
        </html>
    `;
}

function getReportTypeLabel(reportType: ReportType): string {
    switch (reportType) {
        case 'tag-status':
            return 'Tag Status Report';
        case 'maintenance':
            return 'Maintenance Report';
        case 'inventory':
            return 'Inventory Summary';
        default:
            return 'General Report';
    }
}
