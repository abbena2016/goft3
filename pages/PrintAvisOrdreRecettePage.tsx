import React from 'react';
import { Page } from '../types';
import PrintOrdreRecettePage from './PrintOrdreRecettePage';

interface PrintAvisOrdreRecettePageProps {
    navigate: (page: Page, id?: number, tab?: string) => void;
    paiementId: number;
}

const PrintAvisOrdreRecettePage: React.FC<PrintAvisOrdreRecettePageProps> = ({ navigate, paiementId }) => {
    return (
        <PrintOrdreRecettePage 
            navigate={navigate} 
            paiementId={paiementId} 
            variant="AVIS" 
        />
    );
};

export default PrintAvisOrdreRecettePage;
