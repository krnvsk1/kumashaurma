using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Kumashaurma.API.Models;

namespace Kumashaurma.API.Data
{
    public class ApplicationDbContext : IdentityDbContext<AppUser, IdentityRole<int>, int>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Shawarma & Orders
        public DbSet<Shawarma> Shawarmas { get; set; } = null!;
        public DbSet<Order> Orders { get; set; } = null!;
        public DbSet<OrderItem> OrderItems { get; set; } = null!;
        public DbSet<ShawarmaImage> ShawarmaImages { get; set; } = null!;

        // Addons
        public DbSet<AddonCategory> AddonCategories { get; set; } = null!;
        public DbSet<Addon> Addons { get; set; } = null!;
        public DbSet<ShawarmaAddon> ShawarmaAddons { get; set; } = null!;
        public DbSet<OrderItemAddon> OrderItemAddons { get; set; } = null!;

        // Auth
        public DbSet<UserAddress> UserAddresses { get; set; } = null!;
        public DbSet<SmsVerificationCode> SmsVerificationCodes { get; set; } = null!;
        public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Переименование таблиц Identity
            modelBuilder.Entity<AppUser>(entity => entity.ToTable("users"));
            modelBuilder.Entity<IdentityRole<int>>(entity => entity.ToTable("roles"));
            modelBuilder.Entity<IdentityUserRole<int>>(entity => entity.ToTable("user_roles"));
            modelBuilder.Entity<IdentityUserClaim<int>>(entity => entity.ToTable("user_claims"));
            modelBuilder.Entity<IdentityUserLogin<int>>(entity => entity.ToTable("user_logins"));
            modelBuilder.Entity<IdentityRoleClaim<int>>(entity => entity.ToTable("role_claims"));
            modelBuilder.Entity<IdentityUserToken<int>>(entity => entity.ToTable("user_tokens"));

            // Order configuration
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.UserId);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.User)
                    .WithMany(u => u.Orders)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // OrderItem configuration
            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.HasOne(e => e.Order)
                    .WithMany(o => o.OrderItems)
                    .HasForeignKey(e => e.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Shawarma configuration
            modelBuilder.Entity<Shawarma>(entity =>
            {
                entity.HasIndex(e => e.Name).IsUnique();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // AddonCategory configuration
            modelBuilder.Entity<AddonCategory>(entity =>
            {
                entity.HasIndex(e => e.Name);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // Addon configuration
            modelBuilder.Entity<Addon>(entity =>
            {
                entity.HasIndex(e => e.Name);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.Category)
                    .WithMany(c => c.Addons)
                    .HasForeignKey(e => e.AddonCategoryId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ShawarmaAddon configuration
            modelBuilder.Entity<ShawarmaAddon>(entity =>
            {
                entity.HasIndex(e => new { e.ShawarmaId, e.AddonId }).IsUnique();

                entity.HasOne(e => e.Shawarma)
                    .WithMany(s => s.Addons)
                    .HasForeignKey(e => e.ShawarmaId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Addon)
                    .WithMany(a => a.Shawarmas)
                    .HasForeignKey(e => e.AddonId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // OrderItemAddon configuration
            modelBuilder.Entity<OrderItemAddon>(entity =>
            {
                entity.HasOne(e => e.OrderItem)
                    .WithMany(oi => oi.SelectedAddons)
                    .HasForeignKey(e => e.OrderItemId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ShawarmaImage configuration
            modelBuilder.Entity<ShawarmaImage>(entity =>
            {
                entity.HasOne(e => e.Shawarma)
                    .WithMany(s => s.Images)
                    .HasForeignKey(e => e.ShawarmaId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // UserAddress configuration
            modelBuilder.Entity<UserAddress>(entity =>
            {
                entity.HasIndex(e => e.UserId);
                entity.HasOne(e => e.User)
                    .WithMany(u => u.Addresses)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // SmsVerificationCode configuration
            modelBuilder.Entity<SmsVerificationCode>(entity =>
            {
                entity.HasIndex(e => e.Phone);
                entity.HasIndex(e => e.ExpiresAt);
            });

            // RefreshToken configuration
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasIndex(e => e.Token);
                entity.HasIndex(e => e.UserId);

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
