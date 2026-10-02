import { Link } from 'react-router-dom';
import { getImage } from '../data/imageMap';

/** The ভ্রমণবন্ধু logo image (path comes from the image map), linking to `to`. */
export default function Logo({ to = '/', className = 'h-10' }) {
  return (
    <Link to={to} className="shrink-0" aria-label="ভ্রমণবন্ধু — home">
      <img src={getImage('site', 'logo')} alt="ভ্রমণবন্ধু" className={`w-auto ${className}`} />
    </Link>
  );
}
