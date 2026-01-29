export interface Review {
  id: string;
  authorName: string;
  authorPhoto?: string;
  rating: number; // 1-5
  text: string;
  date: string; // ISO date string or formatted date
}

export const reviews: Review[] = [
  {
    id: "1",
    authorName: "Ashley Feltz",
    rating: 5,
    text: "Great place in town to grab a coffee and breakfast. They have a great variety on their menu- chicken schnitzel sandwich and egg and bacon rolls are delicious! Staff are very friendly. Lots of seating inside and outdoors.",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // a week ago
  },
  {
    id: "2",
    authorName: "Chella Bella",
    rating: 5,
    text: "The chai tea with honey is so good! Really love it how you guys offer seed oil free options. Everyone that works here is so kind. You can feel the love in this Cafe from the moment you walk in the door. Ps Sophie is the best!",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // a week ago
  },
  {
    id: "3",
    authorName: "Iryna K",
    rating: 5,
    text: "Nice space. Coffee and food are good. Enjoyed it. I will definitely come back!",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // a week ago
  },
  {
    id: "4",
    authorName: "Keshia",
    rating: 5,
    text: "Everyone should come down to Hooligans in Brookvale. Amazing, friendly, relaxed vibes. Great, friendly customer service and the coffee food is amazing.",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // a week ago
  },
  {
    id: "5",
    authorName: "Simon Harrison",
    rating: 5,
    text: "Hooligans is a great cafe in Brookvale! We always stop by for a coffee before we go fishing 🎣.",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
  {
    id: "6",
    authorName: "Craig Hood",
    rating: 5,
    text: "Epic little spot in the brooky industrial area. Excellent black coffee and super fresh, tasty muffins. Well worth a visit.",
    date: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 minutes ago
  },
  {
    id: "7",
    authorName: "Victoria Spettigue",
    rating: 5,
    text: "The staff were lovely and the food was great. It's a very chilled vibe and they welcome kids.",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // a week ago
  },
];
