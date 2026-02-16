from __future__ import annotations

from weasyprint import HTML


def _format_inr(amount) -> str:
    """Format a number as INR currency."""
    try:
        val = float(amount)
        if val == int(val):
            return f"\u20b9{int(val):,}"
        return f"\u20b9{val:,.2f}"
    except (ValueError, TypeError):
        return "\u20b90"


def _format_date(date_str) -> str:
    if not date_str:
        return "-"
    try:
        from datetime import date, datetime

        if isinstance(date_str, (date, datetime)):
            return date_str.strftime("%d %b %Y")
        d = datetime.fromisoformat(str(date_str).replace("Z", "+00:00"))
        return d.strftime("%d %b %Y")
    except Exception:
        return str(date_str)


def generate_quote_pdf(quote_data: dict) -> bytes:
    """Generate a PDF from quote data and return bytes."""
    html_content = _build_quote_html(quote_data)
    return HTML(string=html_content).write_pdf()


def _build_quote_html(q: dict) -> str:
    """Build the HTML template for the quote PDF."""
    status = q.get("status", "draft")
    status_class = f"status-{status}"

    # Info blocks
    info_blocks = f"""
    <div class="info-block">
      <div class="label">Customer</div>
      <div class="value">{q.get('customerName', '-')}</div>
    </div>
    """
    if q.get("partnerName"):
        info_blocks += f"""
    <div class="info-block">
      <div class="label">Partner</div>
      <div class="value">{q['partnerName']}</div>
    </div>
    """
    info_blocks += f"""
    <div class="info-block">
      <div class="label">Date</div>
      <div class="value">{_format_date(q.get('createdAt'))}</div>
    </div>
    """
    if q.get("validUntil"):
        info_blocks += f"""
    <div class="info-block">
      <div class="label">Valid Until</div>
      <div class="value">{_format_date(q['validUntil'])}</div>
    </div>
    """

    # Line items
    line_items = q.get("lineItems", [])
    rows_html = ""
    for idx, li in enumerate(line_items):
        product_name = li.get("productName") or "-"
        description = li.get("description") or ""
        desc_html = ""
        if description and description != product_name:
            desc_html = f'<div class="desc">{description}</div>'

        rows_html += f"""
        <tr>
          <td class="center">{idx + 1}</td>
          <td>
            <div class="product-name">{product_name}</div>
            {desc_html}
          </td>
          <td class="center">{li.get('quantity', 0)}</td>
          <td class="right">{_format_inr(li.get('unitPrice', 0))}</td>
          <td class="right bold">{_format_inr(li.get('lineTotal', 0))}</td>
        </tr>
        """

    if not rows_html:
        rows_html = '<tr><td colspan="5" class="center empty">No line items</td></tr>'

    # Totals
    discount_html = ""
    discount_amount = float(q.get("discountAmount", 0))
    if discount_amount > 0:
        discount_html = f"""
      <div class="row discount">
        <span class="label">Discount</span>
        <span class="value">-{_format_inr(discount_amount)}</span>
      </div>
      """

    tax_rate = q.get("taxRate", 18)

    # Terms
    terms_html = ""
    terms = q.get("terms")
    notes = q.get("notes")
    if terms or notes:
        inner = ""
        if terms:
            inner += f"""
      <div>
        <h3>Terms &amp; Conditions</h3>
        <p>{terms}</p>
      </div>
      """
        if notes:
            inner += f"""
      <div>
        <h3>Notes</h3>
        <p>{notes}</p>
      </div>
      """
        terms_html = f'<div class="terms-section"><div class="terms-grid">{inner}</div></div>'

    quote_number = q.get("quoteNumber") or q.get("id", "")[:8]

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Quote - {quote_number}</title>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
      background: #fff;
      padding: 40px;
      font-size: 14px;
      line-height: 1.6;
    }}
    .header {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid #e2e8f0;
    }}
    .header h1 {{
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }}
    .header .quote-number {{
      font-size: 15px;
      color: #64748b;
    }}
    .header .status {{
      display: inline-block;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}
    .status-draft {{ background: #f1f5f9; color: #475569; }}
    .status-sent {{ background: #dbeafe; color: #1d4ed8; }}
    .status-accepted {{ background: #d1fae5; color: #047857; }}
    .status-rejected {{ background: #fee2e2; color: #dc2626; }}
    .info-grid {{
      display: flex;
      gap: 40px;
      margin-bottom: 32px;
    }}
    .info-block {{ flex: 1; }}
    .info-block .label {{
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      margin-bottom: 4px;
    }}
    .info-block .value {{
      font-size: 14px;
      color: #1e293b;
      font-weight: 500;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }}
    thead th {{
      padding: 10px 12px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
    }}
    thead th.right {{ text-align: right; }}
    thead th.center {{ text-align: center; }}
    tbody td {{
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }}
    tbody td.center {{ text-align: center; color: #64748b; }}
    tbody td.right {{ text-align: right; }}
    tbody td.bold {{ font-weight: 600; color: #1e293b; }}
    tbody td.empty {{ padding: 20px; color: #94a3b8; }}
    .product-name {{ font-weight: 600; color: #1e293b; }}
    .desc {{ font-size: 12px; color: #64748b; margin-top: 2px; }}
    .desc strong {{ font-weight: 600; }}
    .desc em {{ font-style: italic; }}
    .desc ul {{ list-style: disc; padding-left: 16px; }}
    .desc ol {{ list-style: decimal; padding-left: 16px; }}
    .totals-section {{
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }}
    .totals-table {{ width: 280px; }}
    .totals-table .row {{
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
    }}
    .totals-table .row .label {{ color: #64748b; }}
    .totals-table .row .value {{ font-weight: 500; color: #1e293b; }}
    .totals-table .row.discount .value {{ color: #dc2626; }}
    .totals-table .total-row {{
      display: flex;
      justify-content: space-between;
      padding: 12px 0 0;
      margin-top: 8px;
      border-top: 2px solid #e2e8f0;
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
    }}
    .terms-section {{
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
    }}
    .terms-section h3 {{
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 8px;
    }}
    .terms-section p {{
      font-size: 13px;
      color: #475569;
      white-space: pre-wrap;
      line-height: 1.7;
    }}
    .terms-grid {{
      display: flex;
      gap: 40px;
    }}
    .terms-grid > div {{ flex: 1; }}
    @media print {{
      body {{ padding: 20px; }}
      @page {{ margin: 20mm; }}
    }}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Quotation</h1>
      <div class="quote-number">{quote_number}</div>
    </div>
    <span class="status {status_class}">
      {status.capitalize()}
    </span>
  </div>

  <div class="info-grid">
    {info_blocks}
  </div>

  <table>
    <thead>
      <tr>
        <th class="center" style="width:40px;">#</th>
        <th>Product / Description</th>
        <th class="center" style="width:60px;">Qty</th>
        <th class="right" style="width:120px;">Unit Price</th>
        <th class="right" style="width:120px;">Total</th>
      </tr>
    </thead>
    <tbody>
      {rows_html}
    </tbody>
  </table>

  <div class="totals-section">
    <div class="totals-table">
      <div class="row">
        <span class="label">Subtotal</span>
        <span class="value">{_format_inr(q.get('subtotal', 0))}</span>
      </div>
      {discount_html}
      <div class="row">
        <span class="label">Tax ({tax_rate}%)</span>
        <span class="value">{_format_inr(q.get('taxAmount', 0))}</span>
      </div>
      <div class="total-row">
        <span>Total</span>
        <span>{_format_inr(q.get('totalAmount', 0))}</span>
      </div>
    </div>
  </div>

  {terms_html}
</body>
</html>"""
