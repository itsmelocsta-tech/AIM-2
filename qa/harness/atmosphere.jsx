import React from 'react';
import {createRoot} from 'react-dom/client';
import {AtmosphereCalibration} from '../../src/components/modules/AtmosphereCalibration';
createRoot(document.getElementById('root')).render(<AtmosphereCalibration userId="qa-atmosphere-user" />);
