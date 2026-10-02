// This code is used for the TicketQR component - the QR ticket a registered user shows at the entrance.
// The QR simply contains the ticket code; the server does all the checking when the admin scans it.
import { QRCodeSVG } from 'qrcode.react';

const TicketQR = ({ code, size = 140 }) => (
    <div className="inline-flex flex-col items-center">
        {/* white padding around the QR ("quiet zone") makes it much easier for cameras to scan */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <QRCodeSVG value={code} size={size} level="M" />
        </div>
        <p className="mt-2 font-mono text-xs tracking-widest text-slate-500">{code}</p>
    </div>
);

export default TicketQR;
