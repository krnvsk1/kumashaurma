using Microsoft.EntityFrameworkCore;
using Kumashaurma.API.Models;

namespace Kumashaurma.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }
        
        public DbSet<Shawarma> Shawarmas { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<ShawarmaImage> ShawarmaImages { get; set; }
        
        // НОВЫЕ DbSet
        public DbSet<AddonCategory> AddonCategories { get; set; }
        public DbSet<Addon> Addons { get; set; }
        public DbSet<ShawarmaAddon> ShawarmaAddons { get; set; }
        public DbSet<OrderItemAddon> OrderItemAddons { get; set; }
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Shawarma configuration
            modelBuilder.Entity<Shawarma>(entity =>
            {
                entity.HasIndex(e => e.Name).IsUnique();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            });
            
            // Order configuration
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => e.Status);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            });
            
            // OrderItem configuration
            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.HasOne(e => e.Order)
                    .WithMany(o => o.OrderItems)
                    .HasForeignKey(e => e.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
            
            // НОВОЕ: AddonCategory configuration
            modelBuilder.Entity<AddonCategory>(entity =>
            {
                entity.HasIndex(e => e.Name);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            });
            
            // НОВОЕ: Addon configuration
            modelBuilder.Entity<Addon>(entity =>
            {
                entity.HasIndex(e => e.Name);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                
                entity.HasOne(e => e.Category)
                    .WithMany(c => c.Addons)
                    .HasForeignKey(e => e.AddonCategoryId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
            
            // НОВОЕ: ShawarmaAddon configuration (многие-ко-многим)
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
            
            // НОВОЕ: OrderItemAddon configuration
            modelBuilder.Entity<OrderItemAddon>(entity =>
            {
                entity.HasOne(e => e.OrderItem)
                    .WithMany(oi => oi.SelectedAddons)
                    .HasForeignKey(e => e.OrderItemId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}