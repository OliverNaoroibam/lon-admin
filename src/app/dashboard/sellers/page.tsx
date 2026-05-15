import Header from '@/components/header';
import { SellerQueue } from './seller-queue';

export default function SellersPage() {
  return (
    <>
      <Header title="Seller Applications" />
      <div className="p-8">
        <SellerQueue />
      </div>
    </>
  );
}
