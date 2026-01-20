import { NextResponse } from "next/server";
import { sanitizeInput } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { tourist, destinationName } = await request.json();

    if (!tourist) {
      return NextResponse.json({ error: "Tourist data is required" }, { status: 400 });
    }

    const checkInStr = tourist.checkInDate ? new Date(tourist.checkInDate).toLocaleDateString() : 'N/A';
    const checkOutStr = tourist.checkOutDate ? new Date(tourist.checkOutDate).toLocaleDateString() : 'N/A';
    const statusFormatted = tourist.status 
      ? sanitizeInput(tourist.status.charAt(0).toUpperCase() + tourist.status.slice(1)) 
      : 'N/A';
    const statusUpper = tourist.status ? sanitizeInput(tourist.status.toUpperCase()) : 'N/A';
    const generatedOn = `${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Booking Receipt</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      color: black;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .subtitle {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
    }
    .receipt-title {
      font-size: 18px;
      font-weight: bold;
      color: #2563eb;
      margin: 10px 0;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 15px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 5px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    .info-item {
      margin-bottom: 10px;
    }
    .label {
      font-weight: bold;
      font-size: 12px;
      color: #555;
    }
    .value {
      font-size: 14px;
      margin-top: 2px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #333;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .status-info {
      display: flex;
      justify-content: space-between;
      margin-top: 15px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Tourist Management System</div>
    <div class="subtitle">Tourism Management System - India</div>
    <div class="receipt-title">BOOKING CONFIRMATION</div>
    <div class="subtitle">Reference: ${sanitizeInput(tourist.id)}</div>
    <div class="subtitle">Generated on: ${generatedOn}</div>
  </div>
  
  <div class="section">
    <div class="section-title">Visitor Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="label">Full Name</div>
        <div class="value">${sanitizeInput(tourist.name)}</div>
      </div>
      <div class="info-item">
        <div class="label">Email Address</div>
        <div class="value">${sanitizeInput(tourist.email)}</div>
      </div>
      <div class="info-item">
        <div class="label">Phone Number</div>
        <div class="value">${sanitizeInput(tourist.phone)}</div>
      </div>
      <div class="info-item">
        <div class="label">ID Proof</div>
        <div class="value">${sanitizeInput(tourist.idProof)}</div>
      </div>
      <div class="info-item">
        <div class="label">Nationality</div>
        <div class="value">${sanitizeInput(tourist.nationality)}</div>
      </div>
      <div class="info-item">
        <div class="label">Group Size</div>
        <div class="value">${tourist.groupSize}</div>
      </div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Travel Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="label">Destination</div>
        <div class="value">${sanitizeInput(destinationName || "Unknown Destination")}</div>
      </div>
      <div class="info-item">
        <div class="label">Status</div>
        <div class="value">${statusFormatted}</div>
      </div>
      <div class="info-item">
        <div class="label">Check-in Date</div>
        <div class="value">${checkInStr}</div>
      </div>
      <div class="info-item">
        <div class="label">Check-out Date</div>
        <div class="value">${checkOutStr}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Emergency Contact</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="label">Contact Name</div>
        <div class="value">${sanitizeInput(tourist.emergencyContact?.name)}</div>
      </div>
      <div class="info-item">
        <div class="label">Contact Phone</div>
        <div class="value">${sanitizeInput(tourist.emergencyContact?.phone)}</div>
      </div>
      <div class="info-item">
        <div class="label">Relationship</div>
        <div class="value">${sanitizeInput(tourist.emergencyContact?.relationship)}</div>
      </div>
    </div>
  </div>
  
  <div class="footer">
    <div>This is an official booking receipt issued by the Tourist Management System</div>
    <div>For inquiries, contact: support@tms-india.gov.in | +91-180-2500100</div>
    <div>Government of India | Ministry of Tourism</div>
    <div class="status-info">
      <span>Status: ${statusUpper}</span>
      <span>Valid until: ${checkOutStr}</span>
    </div>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Error generating receipt:", error);
    return NextResponse.json({ error: "Failed to generate receipt" }, { status: 500 });
  }
}
