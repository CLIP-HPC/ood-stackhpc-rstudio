# Limits of the interactive QOS that every OOD session gets on CBE.next, whatever the
# partition. Read from Slurm, so the form follows QOS changes. Loaded by form.yml.erb,
# local/form.yml.erb and submit.yml.erb, which run as the user on the OOD host.
# Same approach as the Remote Desktop app's qos_limits.rb.
require "open3"

module RStudioQos
  # Used when sacctmgr fails, and for a limit the QOS doesn't set (2026-11 values)
  # (guarded: the ERB files `load` this file on every render)
  FALLBACK = { hours: 12, cpu: 48, mem_gb: 1000, gpu: 2, jobs: 5 }.freeze unless const_defined?(:FALLBACK)

  # Per-session wall time and per-user totals of the interactive QOS
  def self.limits
    out, status = Open3.capture2("sacctmgr", "-nP", "show", "qos", "interactive",
                                 "format=maxwall,maxtrespu,maxjobspu")
    line = out.lines.first
    return FALLBACK unless status.success? && line

    wall, tres, jobs = line.strip.split("|", -1)
    tres = tres.to_s.split(",").to_h { |kv| kv.split("=", 2) }
    {
      hours: wall_hours(wall) || FALLBACK[:hours],
      cpu: tres["cpu"]&.to_i || FALLBACK[:cpu],
      mem_gb: mem_gb(tres["mem"]) || FALLBACK[:mem_gb],
      gpu: tres["gres/gpu"]&.to_i || FALLBACK[:gpu],
      jobs: jobs.to_s.empty? ? FALLBACK[:jobs] : jobs.to_i
    }
  rescue StandardError
    FALLBACK
  end

  # Choices for the wall time select: the usual steps below the QOS limit, plus the limit
  def self.hour_options(max_hours)
    [1, 2, 4, 8, 12, 24, 48].select { |h| h < max_hours } + [max_hours]
  end

  # "12:00:00", "2-00:00:00" -> whole hours
  def self.wall_hours(wall)
    m = wall.to_s.match(/\A(?:(\d+)-)?(\d+):(\d+):(\d+)\z/) or return nil
    m[1].to_i * 24 + m[2].to_i
  end

  # "1000G", "1T", "512000M" -> GB
  def self.mem_gb(mem)
    m = mem.to_s.match(/\A(\d+(?:\.\d+)?)([KMGT]?)\z/) or return nil
    (m[1].to_f * { "K" => 1.0 / 1024**2, "M" => 1.0 / 1024, "" => 1.0 / 1024, "G" => 1, "T" => 1024 }[m[2]]).floor
  end
end
