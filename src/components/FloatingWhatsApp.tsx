import React from "react";
import "./FloatingWhatsApp.css";

interface FloatingWhatsAppProps {
  phoneNumber?: string;
  message?: string;
  badgeCount?: number | string;
}

const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({
  phoneNumber = "919503160267",
  message = "Hello ICE Computer, I would like to inquire about courses and admissions.",
  badgeCount = "3",
}) => {
  // Official WhatsApp click-to-chat URL format
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="floating-whatsapp-pill-btn"
      aria-label="Chat on WhatsApp"
      title="Chat with us on WhatsApp"
    >
      <span className="floating-whatsapp-icon-wrapper">
        <i className="bi bi-whatsapp"></i>
      </span>

      <span className="floating-whatsapp-text">WhatsApp Chat</span>

      {badgeCount && (
        <span className="floating-whatsapp-badge" title="Notifications">
          {badgeCount}
        </span>
      )}
    </a>
  );
};

export default FloatingWhatsApp;
