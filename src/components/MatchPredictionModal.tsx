import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { nbaApi, TodayGame, Player } from "@/services/nbaApi";
import {
  Brain,
  X,
  ChevronsUpDown,
  Star,
  ChevronRight,
  Zap,
} from "lucide-react";
import { getTeamCode } from "@/lib/teamMapping";

interface MatchPredictionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: TodayGame | null;
}

export function MatchPredictionModal({
  open,
  onOpenChange,
  game,
}: MatchPredictionModalProps) {
  const [homeMissingPlayers, setHomeMissingPlayers] = useState<Player[]>([]);
  const [awayMissingPlayers, setAwayMissingPlayers] = useState<Player[]>([]);
  const [homeSearchQuery, setHomeSearchQuery] = useState("");
  const [awaySearchQuery, setAwaySearchQuery] = useState("");
  const [homePopoverOpen, setHomePopoverOpen] = useState(false);
  const [awayPopoverOpen, setAwayPopoverOpen] = useState(false);

  const homeTeamId = game ? getTeamCode(game.homeTeam) : "";
  const awayTeamId = game ? getTeamCode(game.awayTeam) : "";

  const { data: homeRoster = [] } = useQuery({
    queryKey: ["team-roster", homeTeamId],
    queryFn: () => nbaApi.getTeamRoster(homeTeamId),
    enabled: !!homeTeamId,
  });

  const { data: awayRoster = [] } = useQuery({
    queryKey: ["team-roster", awayTeamId],
    queryFn: () => nbaApi.getTeamRoster(awayTeamId),
    enabled: !!awayTeamId,
  });

  const homePlayerSearchResults = homeRoster.filter((player) =>
    player.full_name.toLowerCase().includes(homeSearchQuery.toLowerCase())
  );

  const awayPlayerSearchResults = awayRoster.filter((player) =>
    player.full_name.toLowerCase().includes(awaySearchQuery.toLowerCase())
  );

  const {
    data: prediction,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      "match-prediction",
      homeTeamId,
      awayTeamId,
      homeMissingPlayers.map((p) => p.id).join(","),
      awayMissingPlayers.map((p) => p.id).join(","),
    ],
    queryFn: () =>
      nbaApi.predictMatch(
        homeTeamId,
        awayTeamId,
        homeMissingPlayers.map((p) => p.id),
        awayMissingPlayers.map((p) => p.id)
      ),
    enabled: open && !!homeTeamId && !!awayTeamId,
  });

  const addHomeMissingPlayer = useCallback(
    (player: Player) => {
      if (!homeMissingPlayers.find((p) => p.id === player.id)) {
        setHomeMissingPlayers([...homeMissingPlayers, player]);
      }
      setHomeSearchQuery("");
      setHomePopoverOpen(false);
    },
    [homeMissingPlayers]
  );

  const addAwayMissingPlayer = useCallback(
    (player: Player) => {
      if (!awayMissingPlayers.find((p) => p.id === player.id)) {
        setAwayMissingPlayers([...awayMissingPlayers, player]);
      }
      setAwaySearchQuery("");
      setAwayPopoverOpen(false);
    },
    [awayMissingPlayers]
  );

  const removeHomeMissingPlayer = useCallback(
    (playerId: number) => {
      setHomeMissingPlayers(homeMissingPlayers.filter((p) => p.id !== playerId));
    },
    [homeMissingPlayers]
  );

  const removeAwayMissingPlayer = useCallback(
    (playerId: number) => {
      setAwayMissingPlayers(awayMissingPlayers.filter((p) => p.id !== playerId));
    },
    [awayMissingPlayers]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="border-b border-blue-500/20 px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-purple-400" />
            <span className="text-foreground">Match Analysis</span>
            <span className="text-muted-foreground text-sm font-normal ml-auto">
              {game?.awayTeam} @ {game?.homeTeam}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="space-y-4 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Analyzing forecast...</p>
                </div>
              </div>
            ) : prediction ? (
              <div className="space-y-6">
                {/* ============ SECTION 1: HOME TEAM ABSENCES ============ */}
                <Card className="border-blue-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{game?.homeTeam} - Absences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Popover
                      open={homePopoverOpen}
                      onOpenChange={setHomePopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={homePopoverOpen}
                          className="w-full justify-between text-left font-normal h-9 border-blue-500/30"
                        >
                          <span className="text-muted-foreground text-sm">
                            {homeMissingPlayers.length === 0
                              ? "Add players..."
                              : `${homeMissingPlayers.length} selected`}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <Input
                            placeholder="Search by name..."
                            value={homeSearchQuery}
                            onChange={(e) => setHomeSearchQuery(e.target.value)}
                            className="border-0 border-b rounded-none focus-visible:ring-0"
                          />
                          <CommandList>
                            <CommandEmpty>No players found.</CommandEmpty>
                            <CommandGroup>
                              {homePlayerSearchResults.map((player) => (
                                <CommandItem
                                  key={player.id}
                                  value={player.full_name}
                                  onSelect={() => addHomeMissingPlayer(player)}
                                  disabled={
                                    homeMissingPlayers.find(
                                      (p) => p.id === player.id
                                    ) !== undefined
                                  }
                                >
                                  {player.full_name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {homeMissingPlayers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {homeMissingPlayers.map((player) => (
                          <Badge
                            key={player.id}
                            variant="secondary"
                            className="gap-1 text-xs"
                          >
                            {player.full_name}
                            <button
                              onClick={() =>
                                removeHomeMissingPlayer(player.id)
                              }
                              className="ml-1 hover:text-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ============ SECTION 2: AWAY TEAM ABSENCES ============ */}
                <Card className="border-blue-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{game?.awayTeam} - Absences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Popover
                      open={awayPopoverOpen}
                      onOpenChange={setAwayPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={awayPopoverOpen}
                          className="w-full justify-between text-left font-normal h-9 border-blue-500/30"
                        >
                          <span className="text-muted-foreground text-sm">
                            {awayMissingPlayers.length === 0
                              ? "Add players..."
                              : `${awayMissingPlayers.length} selected`}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <Input
                            placeholder="Search by name..."
                            value={awaySearchQuery}
                            onChange={(e) => setAwaySearchQuery(e.target.value)}
                            className="border-0 border-b rounded-none focus-visible:ring-0"
                          />
                          <CommandList>
                            <CommandEmpty>No players found.</CommandEmpty>
                            <CommandGroup>
                              {awayPlayerSearchResults.map((player) => (
                                <CommandItem
                                  key={player.id}
                                  value={player.full_name}
                                  onSelect={() =>
                                    addAwayMissingPlayer(player)
                                  }
                                  disabled={
                                    awayMissingPlayers.find(
                                      (p) => p.id === player.id
                                    ) !== undefined
                                  }
                                >
                                  {player.full_name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {awayMissingPlayers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {awayMissingPlayers.map((player) => (
                          <Badge
                            key={player.id}
                            variant="secondary"
                            className="gap-1 text-xs"
                          >
                            {player.full_name}
                            <button
                              onClick={() =>
                                removeAwayMissingPlayer(player.id)
                              }
                              className="ml-1 hover:text-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ============ SECTION 3: QUICK PLAYER SELECTION TABS ============ */}
                <Card className="border-blue-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Quick Selection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="home" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="home">{game?.homeTeam} Roster</TabsTrigger>
                        <TabsTrigger value="away">{game?.awayTeam} Roster</TabsTrigger>
                      </TabsList>

                      <TabsContent value="home" className="mt-4">
                        <div className="grid grid-cols-4 lg:grid-cols-6 gap-2">
                          {homeRoster.slice(0, 14).map((player) => {
                            const isAbsent = homeMissingPlayers.some(
                              (p) => p.id === player.id
                            );
                            return (
                              <Button
                                key={player.id}
                                onClick={() => addHomeMissingPlayer(player)}
                                disabled={isAbsent}
                                variant={isAbsent ? "ghost" : "outline"}
                                size="sm"
                                className={`text-[11px] h-8 px-2 truncate ${
                                  isAbsent
                                    ? "text-muted-foreground opacity-40 line-through cursor-not-allowed"
                                    : "hover:bg-purple-500/20 hover:border-purple-500/50"
                                }`}
                              >
                                {player.full_name}
                              </Button>
                            );
                          })}
                        </div>
                      </TabsContent>

                      <TabsContent value="away" className="mt-4">
                        <div className="grid grid-cols-4 lg:grid-cols-6 gap-2">
                          {awayRoster.slice(0, 14).map((player) => {
                            const isAbsent = awayMissingPlayers.some(
                              (p) => p.id === player.id
                            );
                            return (
                              <Button
                                key={player.id}
                                onClick={() => addAwayMissingPlayer(player)}
                                disabled={isAbsent}
                                variant={isAbsent ? "ghost" : "outline"}
                                size="sm"
                                className={`text-[11px] h-8 px-2 truncate ${
                                  isAbsent
                                    ? "text-muted-foreground opacity-40 line-through cursor-not-allowed"
                                    : "hover:bg-amber-500/20 hover:border-amber-500/50"
                                }`}
                              >
                                {player.full_name}
                              </Button>
                            );
                          })}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* ============ SECTION 4: PLAYER PROJECTIONS ============ */}
                <Card className="border-blue-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-400" />
                      Roster Projections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="home" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="home" className="text-xs">
                          {game?.homeTeam}
                        </TabsTrigger>
                        <TabsTrigger value="away" className="text-xs">
                          {game?.awayTeam}
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="home">
                        <div className="border border-blue-500/20 rounded-lg overflow-hidden">
                          <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr] gap-3 p-3 bg-slate-800/50 border-b border-blue-500/20 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            <div>Player</div>
                            <div className="text-right">MIN</div>
                            <div className="text-right">PTS</div>
                            <div className="text-right">REB</div>
                            <div className="text-right">AST</div>
                          </div>
                          <div className="space-y-1 max-h-60 overflow-y-auto">
                            {homeRoster.slice(0, 12).map((player) => {
                              const isAbsent = homeMissingPlayers.some(
                                (p) => p.id === player.id
                              );
                              return (
                                <div
                                  key={player.id}
                                  className={`grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr] gap-3 p-3 border-b border-slate-700/50 text-xs items-center hover:bg-slate-800/30 transition ${
                                    isAbsent ? "opacity-40" : ""
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="font-medium text-foreground truncate"
                                    >
                                      {player.full_name}
                                    </span>
                                    {isAbsent && (
                                      <Badge className="text-[8px] h-5 bg-red-500/20 text-red-400 border-red-500/30">
                                        Out
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-right text-muted-foreground">
                                    32
                                  </div>
                                  <div className="text-right font-bold text-cyan-400">
                                    18.5
                                  </div>
                                  <div className="text-right text-muted-foreground">
                                    4.2
                                  </div>
                                  <div className="text-right text-muted-foreground">
                                    5.1
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="away">
                        <div className="border border-blue-500/20 rounded-lg overflow-hidden">
                          <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr] gap-3 p-3 bg-slate-800/50 border-b border-blue-500/20 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            <div>Player</div>
                            <div className="text-right">MIN</div>
                            <div className="text-right">PTS</div>
                            <div className="text-right">REB</div>
                            <div className="text-right">AST</div>
                          </div>
                          <div className="space-y-1 max-h-60 overflow-y-auto">
                            {awayRoster.slice(0, 12).map((player) => {
                              const isAbsent = awayMissingPlayers.some(
                                (p) => p.id === player.id
                              );
                              return (
                                <div
                                  key={player.id}
                                  className={`grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr] gap-3 p-3 border-b border-slate-700/50 text-xs items-center hover:bg-slate-800/30 transition ${
                                    isAbsent ? "opacity-40" : ""
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="font-medium text-foreground truncate"
                                    >
                                      {player.full_name}
                                    </span>
                                    {isAbsent && (
                                      <Badge className="text-[8px] h-5 bg-red-500/20 text-red-400 border-red-500/30">
                                        Out
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-right text-muted-foreground">
                                    32
                                  </div>
                                  <div className="text-right font-bold text-cyan-400">
                                    18.5
                                  </div>
                                  <div className="text-right text-muted-foreground">
                                    4.2
                                  </div>
                                  <div className="text-right text-muted-foreground">
                                    5.1
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Data unavailable
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="border-t border-blue-500/20 px-6 py-4 bg-slate-900 flex gap-3 flex-shrink-0">
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="flex-1 border-blue-500/30 hover:bg-blue-500/10"
          >
            <Zap className="h-3.5 w-3.5 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            size="sm"
            className="flex-1 bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-500 hover:to-blue-500"
          >
            Close
            <ChevronRight className="h-3.5 w-3.5 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
