import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod';

// สร้างเซิร์ฟเวอร์ MCP
const server = new McpServer({
  name: "tax-assistant-server",
  version: "1.0.0",
});

// ลงทะเบียน Tool คำนวณ VAT
server.registerTool(
  'calculate-vat',
  {
    description: 'ใช้สำหรับคำนวณภาษีมูลค่าเพิ่ม (VAT 7%) จากยอดเงินที่กำหนด',
    inputSchema: z.object({
      amount: z.number().describe("ยอดเงินสุทธิที่ต้องการคิดภาษี")
    })
  },
  async ({ amount }) => {
    const vat = amount * 0.07;
    return {
      content: [{ type: 'text', text: `ภาษี VAT 7% ของยอดเงินนี้คือ ${vat} บาท` }]
    };
  }
);

// เชื่อมต่อเซิร์ฟเวอร์ผ่าน Standard Input/Output (Stdio)
const transport = new StdioServerTransport();
await server.connect(transport);