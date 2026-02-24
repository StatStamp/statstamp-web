'use client';

import { BreakdownTeam, BreakdownPlayer } from '@/hooks/breakdowns';
import { CollectionWorkflow } from '@/hooks/collections';
import { EventGroup } from '@/hooks/eventGroups';
import { useTaggingStore, getPlayersCurrentlyInGame } from '@/store/tagging';

interface Props {
  teams: BreakdownTeam[];
  players: BreakdownPlayer[];
  eventGroups: EventGroup[];
  workflows: CollectionWorkflow[];
}

function PlayerButton({
  player,
  onSelect,
}: {
  player: BreakdownPlayer;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="flex items-center gap-2 w-full rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 px-3 py-2.5 text-sm text-zinc-100 transition-colors text-left"
    >
      {player.jersey_number && (
        <span className="text-xs font-mono text-zinc-400 w-6 shrink-0 text-right">
          {player.jersey_number}
        </span>
      )}
      <span className="truncate">{player.player_name}</span>
    </button>
  );
}

export function ParticipantPicker({ teams, players, eventGroups, workflows }: Props) {
  const participantPrompt = useTaggingStore((s) => s.participantPrompt);
  const selectedTimestamp = useTaggingStore((s) => s.selectedTimestamp) ?? 0;
  const selectParticipant = useTaggingStore((s) => s.selectParticipant);

  const lineupWorkflow = workflows.find((w) => w.system_reserved) ?? null;
  const hasTeams = teams.length > 0;

  // Players currently in game (for prioritized section)
  const inGameIds = lineupWorkflow
    ? getPlayersCurrentlyInGame(eventGroups, lineupWorkflow.id, selectedTimestamp)
    : [];

  const inGamePlayers = players.filter((p) => inGameIds.includes(p.id));
  const benchPlayers = players.filter((p) => !inGameIds.includes(p.id));

  function handleSelectPlayer(player: BreakdownPlayer) {
    selectParticipant(player.id, player.player_name ?? null, false);
  }

  function handleSelectTeam(team: BreakdownTeam) {
    selectParticipant(team.id, team.team_name ?? null, true);
  }

  function handleNoAttribution() {
    selectParticipant(null, null, false);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-zinc-300 leading-snug">
        {participantPrompt ?? 'Who?'}
      </p>

      {/* Teams (if matchup mode) */}
      {hasTeams && (
        <div>
          <p className="text-xs text-zinc-500 mb-1.5">Team</p>
          <div className="flex flex-col gap-1.5">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => handleSelectTeam(team)}
                className="flex items-center w-full rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 px-3 py-2.5 text-sm text-zinc-100 transition-colors text-left"
              >
                {team.team_name ?? team.team_abbreviation ?? 'Team'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* In-game players */}
      {inGamePlayers.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1.5">In Game</p>
          <div className="flex flex-col gap-1.5">
            {inGamePlayers.map((player) => (
              <PlayerButton
                key={player.id}
                player={player}
                onSelect={() => handleSelectPlayer(player)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other players */}
      {benchPlayers.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1.5">
            {inGamePlayers.length > 0 ? 'Other Players' : 'Players'}
          </p>
          <div className="flex flex-col gap-1.5">
            {benchPlayers.map((player) => (
              <PlayerButton
                key={player.id}
                player={player}
                onSelect={() => handleSelectPlayer(player)}
              />
            ))}
          </div>
        </div>
      )}

      {/* No attribution */}
      <button
        onClick={handleNoAttribution}
        className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-2 border-t border-zinc-800 mt-2 text-center"
      >
        No attribution
      </button>
    </div>
  );
}
