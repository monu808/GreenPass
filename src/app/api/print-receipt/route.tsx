import { NextResponse } from "next/server";
import { renderToStaticMarkup } from "react-dom/server";
import { sanitizeInput } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { tourist, destinationName } = await request.json();

    if (!tourist) {
      return NextResponse.json({ error: "Tourist data is required" }, { status: 400 });
    }

    const html = "<!DOCTYPE html>" + renderToStaticMarkup(
      <html lang="en">
      <head>
        <title>Booking Receipt</title>
        <style dangerouslySetInnerHTML={{ __html: `
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
        ` }} />
      </head>
      <body>
        <div className="header">
          <div className="title">Tourist Management System</div>
          <div className="subtitle">Tourism Management System - India</div>
          <div className="receipt-title">BOOKING CONFIRMATION</div>
          <div className="subtitle">Reference: {sanitizeInput(tourist.id)}</div>
          <div className="subtitle">Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</div>
        </div>
        
        <div className="section">
          <div className="section-title">Visitor Information</div>
          <div className="info-grid">
            <div className="info-item">
              <div className="label">Full Name</div>
              <div className="value">{sanitizeInput(tourist.name)}</div>
            </div>
            <div className="info-item">
              <div className="label">Email Address</div>
              <div className="value">{sanitizeInput(tourist.email)}</div>
            </div>
            <div className="info-item">
              <div className="label">Phone Number</div>
              <div className="value">{sanitizeInput(tourist.phone)}</div>
            </div>
            <div className="info-item">
              <div className="label">ID Proof</div>
              <div className="value">{sanitizeInput(tourist.idProof)}</div>
            </div>
            <div className="info-item">
              <div className="label">Nationality</div>
              <div className="value">{sanitizeInput(tourist.nationality)}</div>
            </div>
            <div className="info-item">
              <div className="label">Group Size</div>
              <div className="value">{tourist.groupSize}</div>
            </div>
          </div>
        </div>
        
        <div className="section">
          <div className="section-title">Travel Information</div>
          <div className="info-grid">
            <div className="info-item">
              <div className="label">Destination</div>
              <div className="value">{sanitizeInput(destinationName || "Unknown Destination")}</div>
            </div>
            <div className="info-item">
              <div className="label">Status</div>
              <div className="value">
                {tourist.status 
                  ? sanitizeInput(tourist.status.charAt(0).toUpperCase() + tourist.status.slice(1)) 
                  : 'N/A'}
              </div>
            </div>
            <div className="info-item">
              <div className="label">Check-in Date</div>
              <div className="value">{new Date(tourist.checkInDate).toLocaleDateString()}</div>
            </div>
            <div className="info-item">
              <div className="label">Check-out Date</div>
              <div className="value">{new Date(tourist.checkOutDate).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-title">Emergency Contact</div>
          <div className="info-grid">
            <div className="info-item">
              <div className="label">Contact Name</div>
              <div className="value">{sanitizeInput(tourist.emergencyContact?.name)}</div>
            </div>
            <div className="info-item">
              <div className="label">Contact Phone</div>
              <div className="value">{sanitizeInput(tourist.emergencyContact?.phone)}</div>
            </div>
            <div className="info-item">
              <div className="label">Relationship</div>
              <div className="value">{sanitizeInput(tourist.emergencyContact?.relationship)}</div>
            </div>
          </div>
        </div>
        
        <div className="footer">
          <div>This is an official booking receipt issued by the Tourist Management System</div>
          <div>For inquiries, contact: support@tms-india.gov.in | +91-180-2500100</div>
          <div>Government of India | Ministry of Tourism</div>
          <div className="status-info">
            <span>Status: {sanitizeInput(tourist.status?.toUpperCase())}</span>
            <span>Valid until: {new Date(tourist.checkOutDate).toLocaleDateString()}</span>
          </div>
        </div>
      </body>
      </html>
    );

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Error generating receipt:", error);
    return NextResponse.json({ error: "Failed to generate receipt" }, { status: 500 });
  }
}
