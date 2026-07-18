// Central data and constants for the Jugaad Vendor app
import bandhaniImg from "../assets/bandhni_silk_dupatta.png";
import lucknowImg from "../assets/lucknow_chikankari_kurti.png";
export const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: 'Bandhani Silk Dupatta',
    daysUnsold: 31,
    mrp: 850,
    isNegotiable: true,
    isExpanded: false,
    floorPrice: 680,
    image: bandhaniImg,
  },
  {
    id: 2,
    name: 'Pajatran Kurti Sarees',
    daysUnsold: 23,
    mrp: 850,
    isNegotiable: false,
    isExpanded: false,
    floorPrice: null,
    image: lucknowImg,
  },
  {
    id: 3,
    name: 'Bandhani Silk Dupatta',
    daysUnsold: 31,
    mrp: 850,
    isNegotiable: true,
    isExpanded: true,
    floorPrice: 680,
    image: bandhaniImg,
  },
  {
    id: 4,
    name: 'Lucknowi Chikankari Kurti',
    daysUnsold: 16,
    mrp: 1200,
    isNegotiable: false,
    isExpanded: false,
    showEnableBtn: true,
    floorPrice: null,
    image: lucknowImg,
  },
  {
    id: 5,
    name: 'Bandhani Silk Dupatta',
    daysUnsold: 23,
    mrp: 850,
    isNegotiable: false,
    isExpanded: false,
    floorPrice: null,
    image: bandhaniImg,
  },
];

import { LayoutGrid, LineChart, Plus, Settings } from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'products', label: 'My Products', icon: LayoutGrid },
  { id: 'analytics', label: 'Analytics', icon: LineChart },
  { id: 'add', label: 'Add Product', icon: Plus },
  { id: 'settings', label: 'Settings', icon: Settings },
];
