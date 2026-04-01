import { MessageDto, PollDto } from "@api/api-gen/data-contracts";
import { Dialog } from "@components/ui/dialog";
import { useTheme } from "@core";
import React, { FC, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

interface PollDetailModalProps {
  pollId: string;
  messages: MessageDto[];
  onClose: () => void;
}

export const PollDetailModal: FC<PollDetailModalProps> = ({
  pollId,
  messages,
  onClose,
}) => {
  const { colors } = useTheme();

  const poll: PollDto | undefined = useMemo(() => {
    for (const msg of messages) {
      if (msg.poll?.id === pollId) return msg.poll;
    }

    return undefined;
  }, [messages, pollId]);

  if (!poll) return null;

  const hasVoted = (poll.userVotedOptionIds ?? []).length > 0;

  return (
    <Dialog
      isVisible
      onClose={onClose}
      placement="center"
      animationType="scale"
      width="90%"
      enableBackdropClose
    >
      <View style={[styles.container, { backgroundColor: colors.white }]}>
        <Text style={[styles.question, { color: colors.black }]}>
          {poll.question}
        </Text>

        {poll.isMultipleChoice && (
          <Text style={[styles.badge, { color: colors.gray500 }]}>
            Multiple choice
          </Text>
        )}

        <ScrollView style={styles.optionsList}>
          {poll.options.map(option => {
            const percentage =
              poll.totalVotes > 0
                ? Math.round((option.voterCount / poll.totalVotes) * 100)
                : 0;
            const isSelected = (poll.userVotedOptionIds ?? []).includes(
              option.id,
            );

            return (
              <View key={option.id} style={styles.optionRow}>
                <View style={styles.optionHeader}>
                  <Text
                    style={[
                      styles.optionText,
                      { color: colors.black },
                      isSelected && { fontWeight: "700" },
                    ]}
                  >
                    {isSelected ? "✓ " : ""}
                    {option.text}
                  </Text>
                  {hasVoted && (
                    <Text
                      style={[styles.percentage, { color: colors.gray500 }]}
                    >
                      {percentage}%
                    </Text>
                  )}
                </View>

                {hasVoted && (
                  <View
                    style={[
                      styles.progressBg,
                      { backgroundColor: colors.gray100 },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: isSelected
                            ? colors.blue500
                            : colors.gray300,
                        },
                      ]}
                    />
                  </View>
                )}

                <Text style={[styles.voteCount, { color: colors.gray500 }]}>
                  {option.voterCount}{" "}
                  {option.voterCount === 1 ? "vote" : "votes"}
                </Text>

                {!poll.isAnonymous &&
                  "voterIds" in option &&
                  (option as any).voterIds?.length > 0 && (
                    <Text style={[styles.voters, { color: colors.gray300 }]}>
                      {(option as any).voterIds.join(", ")}
                    </Text>
                  )}
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.gray100 }]}>
          <Text style={[styles.totalVotes, { color: colors.gray500 }]}>
            Total: {poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}
          </Text>
          {poll.isClosed && (
            <Text style={[styles.closedBadge, { color: colors.red500 }]}>
              Closed
            </Text>
          )}
        </View>
      </View>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
  },
  question: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  badge: {
    fontSize: 12,
    marginBottom: 12,
  },
  optionsList: {
    maxHeight: 400,
  },
  optionRow: {
    marginBottom: 16,
  },
  optionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  optionText: {
    fontSize: 15,
    flex: 1,
  },
  percentage: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  voteCount: {
    fontSize: 12,
  },
  voters: {
    fontSize: 11,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
  },
  totalVotes: {
    fontSize: 13,
  },
  closedBadge: {
    fontSize: 13,
    fontWeight: "600",
  },
});
