import { createRoot } from 'react-dom/client';
import App from './App';
import MinigameLab from './minigames/MinigameLab';
import './styles.css';
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).has('minigame') ? <MinigameLab /> : <App />);
