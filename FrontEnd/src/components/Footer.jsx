import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-container">
        <span className="footer-text">© {currentYear} Pulkit Singla · AskMate</span>
      </div>
    </footer>
  );
};

export default Footer;


