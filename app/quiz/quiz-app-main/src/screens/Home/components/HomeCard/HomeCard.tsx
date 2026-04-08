import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Heading } from "../../../../components";
import { Image as ImageType } from "../../../../data/types";

export interface Props {
  title: string;
  image?: ImageType;
  numOfQuestions: number;
  duration: number;
  index: number;
  onPress: () => void;
  urlImage: string
}

export function HomeCard({
  title,
  image,
  numOfQuestions,
  duration,
  index,
  onPress,
  urlImage
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[homeCard.root, { marginRight: index % 2 === 0 ? 8 : 0 }]}>
      <View style={homeCard.aspectRatio}>
        <Image
          style={homeCard.image}
          source={image?.uri}
          alt={image?.alt}
          width={300}
          height={150}
        />
      </View>
      <View style={homeCard.textContainer}>
        <Heading text={title} fontSize={18} />
        <View style={homeCard.footer}>
          <Text style={homeCard.footerText}>{numOfQuestions} Questions</Text>
          <Text style={homeCard.footerText}>{duration} min</Text>
        </View>
      </View>
    </Pressable>
  );
}

const homeCard = StyleSheet.create({
  root: {
    flex: 1,
    marginVertical: 8,
    borderRadius: 8,
    borderColor: "#cbd2d9",
    borderWidth: 1,
    overflow: "hidden",
  },
  aspectRatio: {
    
  },
  image: {
    flex: 1,
    resizeMode: "stretch",
  },
  textContainer: {
    padding: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: "#718096",
  },
});
