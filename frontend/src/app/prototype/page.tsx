import PrototypeApp from './prototype-app';
import './prototype.css';

export const metadata = {
  title: 'EssayCoach · Interactive prototype',
  description:
    'Bilingual interactive preview of the EssayCoach learning platform'
};

export default function PrototypePage() {
  return <PrototypeApp />;
}
