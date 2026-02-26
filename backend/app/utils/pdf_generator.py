from __future__ import annotations

import re


def _format_inr(amount) -> str:
    """Format a number as INR currency."""
    try:
        val = float(amount)
        if val == int(val):
            return f"\u20b9{int(val):,}"
        return f"\u20b9{val:,.2f}"
    except (ValueError, TypeError):
        return "\u20b90"


def _format_inr_pdf(amount) -> str:
    """Format a number as INR currency using ASCII-safe prefix for PDF."""
    try:
        val = float(amount)
        if val == int(val):
            return f"Rs.{int(val):,}"
        return f"Rs.{val:,.2f}"
    except (ValueError, TypeError):
        return "Rs.0"


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


def _strip_html(html: str) -> str:
    """Strip HTML tags and convert common tags to plain text."""
    if not html:
        return ""
    # Convert <br>, <p>, <li> to newlines
    text = re.sub(r"<br\s*/?>", "\n", html, flags=re.IGNORECASE)
    text = re.sub(r"</p>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<li[^>]*>", "• ", text, flags=re.IGNORECASE)
    text = re.sub(r"</li>", "\n", text, flags=re.IGNORECASE)
    # Remove all remaining tags
    text = re.sub(r"<[^>]+>", "", text)
    # Decode common HTML entities
    text = (
        text.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&nbsp;", " ")
        .replace("&quot;", '"')
    )
    # Collapse excess whitespace/newlines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def generate_quote_pdf(quote_data: dict) -> bytes:
    """Generate a PDF from quote data and return bytes."""
    from fpdf import FPDF

    # ── Layout constants ──────────────────────────────────────────────────────
    MARGIN = 14
    PAGE_W = 210  # A4 width mm
    USABLE_W = PAGE_W - MARGIN * 2  # 182 mm

    # Colour palette
    C_DARK = (15, 23, 42)       # slate-900
    C_MID = (100, 116, 139)     # slate-500
    C_LIGHT = (226, 232, 240)   # slate-200
    C_BG = (248, 250, 252)      # slate-50
    C_RED = (220, 38, 38)
    C_GREEN_BG = (209, 250, 229)
    C_GREEN_FG = (4, 120, 87)
    C_BLUE_BG = (219, 234, 254)
    C_BLUE_FG = (29, 78, 216)

    # Status colour
    status = (quote_data.get("status") or "draft").lower()
    STATUS_COLORS = {
        "draft":    ((241, 245, 249), (71, 85, 105)),
        "sent":     (C_BLUE_BG, C_BLUE_FG),
        "accepted": (C_GREEN_BG, C_GREEN_FG),
        "rejected": ((254, 226, 226), C_RED),
    }
    status_bg, status_fg = STATUS_COLORS.get(status, STATUS_COLORS["draft"])

    quote_number = quote_data.get("quoteNumber") or str(quote_data.get("id", ""))[:8]

    # ── Build PDF ────────────────────────────────────────────────────────────
    pdf = FPDF()
    pdf.set_margins(MARGIN, MARGIN, MARGIN)
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=MARGIN)

    def set_color(r, g, b):
        pdf.set_text_color(r, g, b)

    def hr(thickness=0.3, color=C_LIGHT):
        pdf.set_draw_color(*color)
        pdf.set_line_width(thickness)
        x = MARGIN
        pdf.line(x, pdf.get_y(), PAGE_W - MARGIN, pdf.get_y())
        pdf.ln(2)

    # ── HEADER ────────────────────────────────────────────────────────────────
    # "Quotation" title (left)
    pdf.set_font("Helvetica", "B", 22)
    set_color(*C_DARK)
    pdf.cell(USABLE_W * 0.6, 10, "Quotation", ln=False)

    # Status badge (right) — draw a filled rounded rect manually via rect
    badge_text = status.upper()
    pdf.set_font("Helvetica", "B", 8)
    badge_w = pdf.get_string_width(badge_text) + 10
    badge_h = 7
    badge_x = PAGE_W - MARGIN - badge_w
    badge_y = pdf.get_y() + 1
    pdf.set_fill_color(*status_bg)
    pdf.set_draw_color(*status_bg)
    pdf.rect(badge_x, badge_y, badge_w, badge_h, style="F")
    pdf.set_xy(badge_x, badge_y + 1)
    set_color(*status_fg)
    pdf.cell(badge_w, badge_h - 2, badge_text, align="C")
    pdf.ln(11)

    # Quote number sub-line
    pdf.set_font("Helvetica", "", 10)
    set_color(*C_MID)
    pdf.cell(0, 5, quote_number, ln=True)
    pdf.ln(4)

    hr(thickness=0.5)
    pdf.ln(4)

    # ── INFO GRID ────────────────────────────────────────────────────────────
    info_items = [("Customer", quote_data.get("customerName") or "-")]
    if quote_data.get("partnerName"):
        info_items.append(("Partner", quote_data["partnerName"]))
    info_items.append(("Date", _format_date(quote_data.get("createdAt"))))
    if quote_data.get("validUntil"):
        info_items.append(("Valid Until", _format_date(quote_data["validUntil"])))

    col_w = USABLE_W / len(info_items)
    label_h = 4
    value_h = 6

    for label, value in info_items:
        x = pdf.get_x()
        y = pdf.get_y()
        pdf.set_font("Helvetica", "B", 8)
        set_color(*C_MID)
        pdf.cell(col_w, label_h, label.upper(), ln=False)
        pdf.set_xy(x, y + label_h)
        pdf.set_font("Helvetica", "", 11)
        set_color(*C_DARK)
        pdf.cell(col_w, value_h, str(value), ln=False)
        pdf.set_xy(x + col_w, y)

    pdf.ln(label_h + value_h + 6)

    # ── LINE ITEMS TABLE ─────────────────────────────────────────────────────
    COL_NUM = 10
    COL_QTY = 18
    COL_PRICE = 35
    COL_TOTAL = 35
    COL_DESC = USABLE_W - COL_NUM - COL_QTY - COL_PRICE - COL_TOTAL

    # Table header
    pdf.set_fill_color(*C_BG)
    pdf.set_draw_color(*C_LIGHT)
    pdf.set_line_width(0.2)
    row_h = 7

    def th(text, w, align="L"):
        pdf.set_font("Helvetica", "B", 8)
        set_color(*C_MID)
        pdf.cell(w, row_h, text.upper(), border=0, align=align, fill=True)

    th("#", COL_NUM, "C")
    th("Product / Description", COL_DESC)
    th("Qty", COL_QTY, "C")
    th("Unit Price", COL_PRICE, "R")
    th("Total", COL_TOTAL, "R")
    pdf.ln()

    # Separator under header
    pdf.set_draw_color(*C_LIGHT)
    pdf.set_line_width(0.4)
    pdf.line(MARGIN, pdf.get_y(), PAGE_W - MARGIN, pdf.get_y())

    # Table rows
    line_items = quote_data.get("lineItems") or []
    if not line_items:
        pdf.set_font("Helvetica", "I", 10)
        set_color(*C_MID)
        pdf.ln(2)
        pdf.cell(0, 8, "No line items", align="C", ln=True)
    else:
        for idx, li in enumerate(line_items):
            product_name = li.get("productName") or "-"
            description = _strip_html(li.get("description") or "")
            # Description only if different from product name
            if description == product_name:
                description = ""

            # Calculate row height (multi-line description)
            pdf.set_font("Helvetica", "", 10)
            desc_lines = 0
            if description:
                pdf.set_font("Helvetica", "", 8)
                # Estimate lines needed
                desc_lines = max(1, len(description) // max(1, int(COL_DESC / 2)))

            row_h_data = max(8, 6 + desc_lines * 4)

            # Alternating row background
            if idx % 2 == 0:
                pdf.set_fill_color(255, 255, 255)
            else:
                pdf.set_fill_color(*C_BG)

            row_y = pdf.get_y()
            row_x = MARGIN

            # #
            pdf.set_xy(row_x, row_y)
            pdf.set_font("Helvetica", "", 9)
            set_color(*C_MID)
            pdf.cell(COL_NUM, row_h_data, str(idx + 1), align="C", fill=True)

            # Product / Description
            pdf.set_xy(row_x + COL_NUM, row_y)
            pdf.set_font("Helvetica", "B", 10)
            set_color(*C_DARK)
            pdf.multi_cell(COL_DESC, 5, product_name, fill=True)
            if description:
                desc_y = pdf.get_y()
                pdf.set_xy(row_x + COL_NUM, desc_y)
                pdf.set_font("Helvetica", "", 8)
                set_color(*C_MID)
                pdf.multi_cell(COL_DESC, 4, description, fill=True)

            cell_bottom = pdf.get_y()

            # Qty
            pdf.set_xy(row_x + COL_NUM + COL_DESC, row_y)
            pdf.set_font("Helvetica", "", 10)
            set_color(*C_MID)
            pdf.cell(COL_QTY, cell_bottom - row_y, str(li.get("quantity", 0)), align="C", fill=True)

            # Unit Price
            pdf.set_xy(row_x + COL_NUM + COL_DESC + COL_QTY, row_y)
            set_color(*C_DARK)
            pdf.cell(COL_PRICE, cell_bottom - row_y, _format_inr_pdf(li.get("unitPrice", 0)), align="R", fill=True)

            # Total
            pdf.set_xy(row_x + COL_NUM + COL_DESC + COL_QTY + COL_PRICE, row_y)
            pdf.set_font("Helvetica", "B", 10)
            pdf.cell(COL_TOTAL, cell_bottom - row_y, _format_inr_pdf(li.get("lineTotal", 0)), align="R", fill=True)

            pdf.set_xy(MARGIN, cell_bottom)

            # Row bottom border
            pdf.set_draw_color(*C_LIGHT)
            pdf.set_line_width(0.2)
            pdf.line(MARGIN, cell_bottom, PAGE_W - MARGIN, cell_bottom)

    pdf.ln(6)

    # ── TOTALS ───────────────────────────────────────────────────────────────
    totals_x = PAGE_W - MARGIN - 75
    totals_w_label = 40
    totals_w_value = 35

    def total_row(label, value, bold=False, color=C_DARK, label_color=C_MID):
        pdf.set_xy(totals_x, pdf.get_y())
        pdf.set_font("Helvetica", "", 10)
        set_color(*label_color)
        pdf.cell(totals_w_label, 7, label, align="L")
        pdf.set_font("Helvetica", "B" if bold else "", 10)
        set_color(*color)
        pdf.cell(totals_w_value, 7, value, align="R", ln=True)

    total_row("Subtotal", _format_inr_pdf(quote_data.get("subtotal", 0)))

    discount = float(quote_data.get("discountAmount") or 0)
    if discount > 0:
        total_row("Discount", f"-{_format_inr_pdf(discount)}", color=C_RED)

    tax_rate = quote_data.get("taxRate", 18)
    total_row(f"Tax ({tax_rate}%)", _format_inr_pdf(quote_data.get("taxAmount", 0)))

    # Divider before grand total
    pdf.set_draw_color(*C_LIGHT)
    pdf.set_line_width(0.4)
    pdf.line(totals_x, pdf.get_y() + 1, PAGE_W - MARGIN, pdf.get_y() + 1)
    pdf.ln(3)
    total_row("Total", _format_inr_pdf(quote_data.get("totalAmount", 0)), bold=True, color=C_DARK, label_color=C_DARK)

    pdf.ln(6)

    # ── TERMS & CONDITIONS ───────────────────────────────────────────────────
    terms = quote_data.get("terms") or ""
    notes = quote_data.get("notes") or ""

    if terms or notes:
        hr()
        pdf.ln(2)

        if terms:
            pdf.set_font("Helvetica", "B", 9)
            set_color(*C_MID)
            pdf.cell(0, 5, "TERMS & CONDITIONS", ln=True)
            pdf.set_font("Helvetica", "", 9)
            set_color(*C_DARK)
            pdf.multi_cell(0, 5, _strip_html(terms))
            pdf.ln(4)

        if notes:
            pdf.set_font("Helvetica", "B", 9)
            set_color(*C_MID)
            pdf.cell(0, 5, "NOTES", ln=True)
            pdf.set_font("Helvetica", "", 9)
            set_color(*C_DARK)
            pdf.multi_cell(0, 5, _strip_html(notes))

    return bytes(pdf.output())
