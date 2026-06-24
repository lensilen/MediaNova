import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useAuth } from "../../hooks/useAuth";
import { addComment, getComments } from "../../utils/socialPosts";

export function CommentSheet({ 
  visible, 
  onClose, 
  comments = [], 
  postId = "",
  onCommentAdded 
}) {
  const [commentText, setCommentText] = useState("");
  const [localComments, setLocalComments] = useState(comments);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const sheetProgress = useSharedValue(0);

  const { user, profile } = useAuth();
  
  const currentUserName = 
    profile?.displayName || 
    user?.displayName || 
    (user?.email ? user.email.split('@')[0] : "You");

  const defaultAvatar = `https://ui-avatars.com/api/?name=${currentUserName}&background=2E3748&color=FFFFFF`;
  const currentUserAvatar = profile?.photoURL || user?.photoURL || defaultAvatar;

  useEffect(() => {
    sheetProgress.set(withTiming(visible ? 1 : 0, { duration: 220 }));
  }, [sheetProgress, visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: sheetProgress.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - sheetProgress.value) * 360 }],
  }));

  useEffect(() => {
    let isActive = true;

    async function loadComments() {
      if (!visible || !postId) return;

      setIsLoading(true);
      const result = await getComments(postId);

      if (!isActive) return;

      if (result.success) {
        setLocalComments(result.comments);
      } else {
        setLocalComments(comments);
      }

      setIsLoading(false);
    }

    loadComments();

    return () => {
      isActive = false;
    };
  }, [comments, postId, visible]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    if (!user?.uid) {
      Alert.alert("Login dibutuhkan", "Masuk dulu sebelum komentar.");
      return;
    }

    setIsSending(true);
    const cleanText = commentText.trim();
    const result = await addComment(postId, user.uid, cleanText, {
      displayName: currentUserName,
      photoURL: currentUserAvatar,
    });

    if (result.success) {
      setLocalComments((items) => [
        ...items,
        {
          ...result.comment,
          displayName: currentUserName,
          photoURL: currentUserAvatar,
          text: cleanText,
        },
      ]);
      setCommentText("");
      onCommentAdded?.(result.comment);
    } else {
      Alert.alert("Komentar gagal", result.error);
    }

    setIsSending(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
    >
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            {/* Langsung menghitung panjang array komentar yang ada */}
            <Text style={styles.title}>
              {localComments.length} Comments
            </Text>

            <Pressable onPress={onClose}>
              <Ionicons
                name="close"
                size={22}
                color="#333"
              />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#2E3748" />
              <Text style={styles.loadingText}>Memuat komentar...</Text>
            </View>
          ) : (
            <FlatList
              data={localComments}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Belum ada komentar.</Text>
              }
              renderItem={({ item }) => {
                const name =
                  item.displayName ||
                  item.name ||
                  (item.userId ? item.userId.slice(0, 8) : "User");
                const avatar =
                  item.photoURL ||
                  item.avatar ||
                  `https://ui-avatars.com/api/?name=${name}&background=2E3748&color=FFFFFF`;

                return (
                  <View style={styles.commentRow}>
                    <Image
                      source={{ uri: avatar }}
                      style={styles.avatar}
                    />

                    <View style={styles.commentContent}>
                      <Text style={styles.commentName}>
                        {name}
                      </Text>
                      <Text style={styles.commentText}>
                        {item.text}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          )}

          <View style={styles.inputRow}>
            <Image 
              source={{ uri: currentUserAvatar }} 
              style={styles.inputAvatar} 
            />

            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Add a comment..."
              style={styles.input}
            />

            <Pressable disabled={isSending} onPress={handleAddComment}>
              {isSending ? (
                <ActivityIndicator color="#1E88E5" />
              ) : (
                <Ionicons
                  name="send"
                  size={24}
                  color="#1E88E5"
                />
              )}
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    height: "70%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  handle: {
    width: 50,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#CCC",
    alignSelf: "center",
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 16, 
    fontWeight: "700",
  },
  commentRow: {
    flexDirection: "row",
    marginBottom: 15,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentName: {
    fontWeight: "700",
    marginBottom: 2,
  },
  commentText: {
    color: "#333",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#EEE",
    paddingTop: 10,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 45,
    backgroundColor: "#F3F3F3",
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  loadingBox: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  loadingText: {
    color: "#666",
    marginTop: 8,
  },
  emptyText: {
    color: "#777",
    marginTop: 24,
    textAlign: "center",
  },
});
