// components/PopupMenu.js
import { usePopupStore } from "../../utils/hooks/use_pop_up_menu";


export default function PopupMenu() {
  const { isOpen, title, message, onContinue, onCancel, closePopup } = usePopupStore();

  if (!isOpen) return null;

  const handleContinue = () => {
    onContinue?.();
    closePopup();
  };

  const handleCancel = () => {
    onCancel?.();
    closePopup();
  };

  return (
    <div className="popup-overlay">
      <div className="popup-menu">
        <h4 className="popup-title">{title}</h4>
        <p className="popup-message">{message}</p>
        <div className="popup-buttons d-flex justify-content-end gap-2 mt-3">
          <button className="btn btn-secondary" onClick={handleCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
