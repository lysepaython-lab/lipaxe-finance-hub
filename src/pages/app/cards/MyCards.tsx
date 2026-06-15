import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CardArtwork } from '@/components/cards/CardArtwork';
import { useMyCardsQuery } from '@/store/api/cardApi';

const MyCards = () => {
  const { t } = useTranslation();
  const { data: cards, isLoading } = useMyCardsQuery();

  return (
    <div className="space-y-6">
      <PageHeader title={t('cards.myCards')} subtitle="" icon={<CreditCard className="h-6 w-6" />} />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="aspect-[1.58/1] rounded-[1.65rem]" />
          <Skeleton className="aspect-[1.58/1] rounded-[1.65rem]" />
          <Skeleton className="aspect-[1.58/1] rounded-[1.65rem]" />
        </div>
      ) : (cards || []).length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(cards || []).map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Link to={`/app/cards/my/${card.id}`} className="group relative block outline-none">
                <CardArtwork
                  image={card.image}
                  brand={card.brand}
                  name={card.name_on_card}
                  holder={card.name_on_card}
                  masked={card.number_masked}
                  exp={card.exp}
                  muted={card.status === 'frozen'}
                  className="transition-smooth group-hover:-translate-y-1 group-hover:shadow-xl"
                />
                <Badge
                  variant={card.status === 'active' ? 'default' : 'secondary'}
                  className="absolute right-4 top-4 capitalize shadow-sm"
                >
                  {card.status}
                </Badge>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">Aucune carte.</CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyCards;
