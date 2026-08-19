import React, {
  createContext,
  useContext
} from 'react';

import { IService } from '../services/types';
import { FlowService } from '../services/FlowService';

const ServiceContext =
  createContext<IService | null>(null);

export const ServiceProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <ServiceContext.Provider
      value={FlowService}
    >
      {children}
    </ServiceContext.Provider>
  );
};

export const useService = (): IService => {
  const service =
    useContext(ServiceContext);

  if (!service) {
    throw new Error(
      'useService phải được sử dụng bên trong ServiceProvider.'
    );
  }

  return service;
};