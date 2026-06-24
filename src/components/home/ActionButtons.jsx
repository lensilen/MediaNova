import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ActionButtons({
  likes = 0,
  comments = 0,
  saves = 0,
  liked = false,
  saved = false,
  onLike,
  onComment,
  onSave,
  onShare,
}) {
  const likeScale = useSharedValue(1);
  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  function handleLikePress() {
    likeScale.set(withSequence(
      withSpring(1.28, { damping: 8, stiffness: 240 }),
      withSpring(1, { damping: 10, stiffness: 180 }),
    ));
    onLike?.();
  }

  return (
    <View style={styles.container}>
      {/* Like Button */}
      <AnimatedPressable
        style={[styles.action, likeAnimatedStyle]}
        onPress={handleLikePress}
      >
        <Ionicons
          name={liked ? "heart" : "heart-outline"}
          size={34}
          color={liked ? "#FF3040" : "#FFFFFF"}
        />
        <Text style={styles.count}>{likes}</Text>
      </AnimatedPressable>

      {/* Comment Button */}
      <Pressable style={styles.action} onPress={onComment}>
        <Ionicons
          name="chatbubble-outline"
          size={34}
          color="#FFFFFF"
        />
        <Text style={styles.count}>{comments}</Text>
      </Pressable>

      {/* Save Button */}
      <Pressable style={styles.action} onPress={onSave}>
        <Ionicons
          name={saved ? "bookmark" : "bookmark-outline"}
          size={34}
          color={saved ? "#FF9800" : "#FFFFFF"} 
        />
        <Text style={styles.count}>{saves}</Text>
      </Pressable>

      {/* Share Button */}
      <Pressable style={styles.action} onPress={onShare}>
        <Ionicons
          name="share-social-outline"
          size={34}
          color="#FFFFFF"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 12,
    bottom: 180,
    alignItems: "center",
  },
  action: {
    alignItems: "center",
    marginBottom: 22,
  },
  count: {
    color: "#FFFFFF",
    marginTop: 4,
    fontWeight: "700",
    fontSize: 11,
  },
});
